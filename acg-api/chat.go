package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const (
	chatMaxTokens     = 400
	chatTimeout       = 30 * time.Second
	chatMaxMessageLen = 2000
)

func chatGuestLimit() int {
	// 优先从 site_settings 读取，没有则回退环境变量，最后默认 5
	var val string
	err := db.QueryRow(`SELECT value FROM site_settings WHERE key = ?`, "chat_guest_limit").Scan(&val)
	if err == nil && val != "" {
		n, parseErr := strconv.Atoi(val)
		if parseErr == nil && n >= 0 {
			return n
		}
	}
	n, err := strconv.Atoi(env("VISITOR_CHAT_LIMIT", "5"))
	if err != nil || n <= 0 {
		return 5
	}
	return n
}

type chatRequest struct {
	Message     string          `json:"message"`
	PageURL     string          `json:"pageUrl"`
	PageTitle   string          `json:"pageTitle"`
	PageContext map[string]any  `json:"pageContext"`
}

type deepseekMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type deepseekRequest struct {
	Model     string             `json:"model"`
	Messages  []deepseekMessage  `json:"messages"`
	MaxTokens int                `json:"max_tokens"`
	Stream    bool               `json:"stream"`
}

type deepseekResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error"`
}

func chatHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/chat")
	path = strings.TrimPrefix(path, "/")
	switch path {
	case "", "quota":
		switch r.Method {
		case http.MethodGet:
			handleChatQuota(w, r)
		case http.MethodPost:
			handleChatSend(w, r)
		case http.MethodOptions:
			w.WriteHeader(http.StatusNoContent)
		default:
			methodNotAllowed(w)
		}
	case "limit":
		switch r.Method {
		case http.MethodGet:
			handleChatLimitGet(w, r)
		case http.MethodPost:
			handleChatLimitSet(w, r)
		case http.MethodOptions:
			w.WriteHeader(http.StatusNoContent)
		default:
			methodNotAllowed(w)
		}
	default:
		http.NotFound(w, r)
	}
}

func handleChatQuota(w http.ResponseWriter, r *http.Request) {
	isOwner, quotaKey := resolveChatIdentity(r)
	chatEnabled := deepseekAPIKey() != ""
	limit := chatGuestLimit()
	if isOwner {
		limit = -1
	}
	used := getDailyChatUsage(quotaKey)
	remaining := limit - used
	if isOwner {
		remaining = -1
	}
	writeJSON(w, map[string]any{
		"limit":       limit,
		"used":        used,
		"remaining":   remaining,
		"isLogin":     isOwner,
		"unlimited":   isOwner,
		"chatEnabled": chatEnabled,
	})
}

func handleChatSend(w http.ResponseWriter, r *http.Request) {
	apiKey := deepseekAPIKey()
	if apiKey == "" {
		writeJSONStatus(w, http.StatusOK, map[string]any{
			"error":       "CHAT_NOT_CONFIGURED",
			"message":     "助手还在沉睡中～站长配置 DeepSeek API Key 后就能聊天啦",
			"chatEnabled": false,
		})
		return
	}

	isOwner, quotaKey := resolveChatIdentity(r)

	if !isOwner {
		used := getDailyChatUsage(quotaKey)
		if used >= chatGuestLimit() {
			writeJSONStatus(w, http.StatusTooManyRequests, map[string]any{
				"error":     "DAILY_LIMIT_EXCEEDED",
				"message":   "今日提问次数用完啦，明天再来问我吧～",
				"limit":     chatGuestLimit(),
				"used":      used,
				"remaining": 0,
				"isLogin":   false,
				"unlimited": false,
			})
			return
		}
	}

	var body chatRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_JSON",
			"message": "请求格式不正确",
		})
		return
	}

	msg := strings.TrimSpace(body.Message)
	if msg == "" {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "EMPTY_MESSAGE",
			"message": "消息不能为空",
		})
		return
	}
	if len(msg) > chatMaxMessageLen {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "MESSAGE_TOO_LONG",
			"message": fmt.Sprintf("消息过长，最多 %d 字", chatMaxMessageLen),
		})
		return
	}

	systemPrompt := buildChatSystemPrompt(body)
	messages := []deepseekMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: msg},
	}

	reply, err := callDeepSeek(apiKey, messages)
	if err != nil {
		log.Printf("[chat] DeepSeek API error: %v", err)
		writeJSONStatus(w, http.StatusServiceUnavailable, map[string]any{
			"error":   "UPSTREAM_ERROR",
			"message": "助手暂时走神了，请稍后再试～",
		})
		return
	}

	incrDailyChatUsage(quotaKey)
	used := getDailyChatUsage(quotaKey)
	limit := chatGuestLimit()
	remaining := limit - used
	if isOwner {
		limit = -1
		remaining = -1
	}

	writeJSON(w, map[string]any{
		"reply":       reply,
		"limit":       limit,
		"used":        used,
		"remaining":   remaining,
		"isLogin":     isOwner,
		"unlimited":   isOwner,
		"chatEnabled": true,
	})
}

// resolveChatIdentity returns (isOwner, quotaKey).
// 站长通过 owner session 识别，享受无限额度；其他访客按 IP 限额。
func resolveChatIdentity(r *http.Request) (bool, string) {
	sess, ok := sessionFromRequest(r)
	if ok && sess.Unlimited {
		return true, fmt.Sprintf("owner:%d", sess.UserID)
	}
	return false, "ip:" + clientIP(r)
}

func buildChatSystemPrompt(body chatRequest) string {
	var sb strings.Builder
	sb.WriteString("你是 hoarfrost.cloud 个人博客的 AI 助手「博客助手」。\n")
	sb.WriteString("你基于 DeepSeek 大语言模型（deepseek-chat），由博客站长部署提供服务。\n")
	sb.WriteString("\n关于这个博客：\n")
	sb.WriteString("- 域名：hoarfrost.cloud\n")
	sb.WriteString("- 前端：React 18 + Vite + Tailwind CSS 3 + GSAP 动画\n")
	sb.WriteString("- 后端：Go 1.22 + SQLite + Session 认证\n")
	sb.WriteString("- 资源存储：腾讯云 COS\n")
	sb.WriteString("- 站长：Dec_snow\n")
	sb.WriteString("\n你的职责：帮助访客了解博客内容、解答技术问题、闲聊等。\n")
	sb.WriteString("回答要求：\n")
	sb.WriteString("- 保持友好、简洁的风格，每次回复不超过 300 字\n")
	sb.WriteString("- 诚实回答，不知道的就说不知道，不要编造\n")
	sb.WriteString("- 如果被问及模型/技术细节，如实说明你基于 DeepSeek\n")
	sb.WriteString("- 用中文回复\n")
	if body.PageTitle != "" {
		sb.WriteString(fmt.Sprintf("\n当前页面：%s", body.PageTitle))
	}
	if body.PageURL != "" {
		sb.WriteString(fmt.Sprintf("\n页面地址：%s", body.PageURL))
	}
	if body.PageContext != nil {
		if section, ok := body.PageContext["siteSection"].(string); ok && section != "" {
			sb.WriteString(fmt.Sprintf("\n站点区域：%s", section))
		}
		if headings, ok := body.PageContext["headings"].([]any); ok && len(headings) > 0 {
			sb.WriteString("\n页面标题：")
			for i, h := range headings {
				if i >= 5 {
					break
				}
				if s, ok := h.(string); ok {
					sb.WriteString(fmt.Sprintf("\n  - %s", s))
				}
			}
		}
	}
	return sb.String()
}

func callDeepSeek(apiKey string, messages []deepseekMessage) (string, error) {
	reqBody := deepseekRequest{
		Model:     deepseekModel(),
		Messages:  messages,
		MaxTokens: chatMaxTokens,
		Stream:    false,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", deepseekBaseURL()+"/v1/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: chatTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("deepseek API returned %d: %s", resp.StatusCode, string(respBody))
	}

	var dsResp deepseekResponse
	if err := json.Unmarshal(respBody, &dsResp); err != nil {
		return "", err
	}
	if dsResp.Error != nil {
		return "", fmt.Errorf("deepseek error: %s", dsResp.Error.Message)
	}
	if len(dsResp.Choices) == 0 {
		return "", fmt.Errorf("deepseek returned no choices")
	}
	return strings.TrimSpace(dsResp.Choices[0].Message.Content), nil
}

func getDailyChatUsage(key string) int {
	today := time.Now().Format("2006-01-02")
	var used int
	err := db.QueryRow(
		`SELECT used FROM chat_quota WHERE user_key = ? AND date = ?`, key, today,
	).Scan(&used)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("[chat] quota query error: %v", err)
	}
	return used
}

func incrDailyChatUsage(key string) {
	today := time.Now().Format("2006-01-02")
	_, err := db.Exec(
		`INSERT INTO chat_quota (user_key, date, used) VALUES (?, ?, 1)
		 ON CONFLICT(user_key, date) DO UPDATE SET used = used + 1`,
		key, today,
	)
	if err != nil {
		log.Printf("[chat] quota increment error: %v", err)
	}
}

func deepseekAPIKey() string {
	return env("DEEPSEEK_API_KEY", "")
}

func deepseekBaseURL() string {
	return env("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
}

func deepseekModel() string {
	return env("DEEPSEEK_MODEL", "deepseek-chat")
}

// ─── 聊天限额管理（站长权限） ───

func handleChatLimitGet(w http.ResponseWriter, r *http.Request) {
	isOwner, _ := resolveChatIdentity(r)
	if !isOwner {
		writeJSONStatus(w, http.StatusForbidden, map[string]any{
			"error":   "FORBIDDEN",
			"message": "仅站长可查看聊天限额设置",
		})
		return
	}
	limit := chatGuestLimit()
	writeJSON(w, map[string]any{
		"limit":     limit,
		"unlimited": limit == 0,
	})
}

type chatLimitRequest struct {
	Limit int `json:"limit"`
}

func handleChatLimitSet(w http.ResponseWriter, r *http.Request) {
	isOwner, _ := resolveChatIdentity(r)
	if !isOwner {
		writeJSONStatus(w, http.StatusForbidden, map[string]any{
			"error":   "FORBIDDEN",
			"message": "仅站长可调整聊天限额",
		})
		return
	}

	var body chatLimitRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_JSON",
			"message": "请求格式不正确",
		})
		return
	}
	if body.Limit < 0 {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_LIMIT",
			"message": "限额不能为负数",
		})
		return
	}
	if body.Limit > 1000 {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_LIMIT",
			"message": "限额不能超过 1000",
		})
		return
	}

	val := strconv.Itoa(body.Limit)
	_, err := db.Exec(
		`INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)
		 ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
		"chat_guest_limit", val, time.Now().UTC().Format(time.RFC3339),
		val, time.Now().UTC().Format(time.RFC3339),
	)
	if err != nil {
		log.Printf("[chat] limit set error: %v", err)
		serverError(w, err)
		return
	}

	log.Printf("[chat] guest limit changed to %d", body.Limit)
	writeJSON(w, map[string]any{
		"ok":        true,
		"limit":     body.Limit,
		"unlimited": body.Limit == 0,
	})
}
