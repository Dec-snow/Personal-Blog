package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"
)

// BirdVision 管理接口 — 代理到 BirdVision 后端
// 通过内网地址访问 BirdVision 的 admin API

func birdvisionBaseURL() string {
	// 默认内网地址，可用环境变量覆盖
	return env("BIRDVISION_API_URL", "http://127.0.0.1:5000/api")
}

// 转发请求到 BirdVision
func proxyBirdVision(method, path string, body any) (map[string]any, int, error) {
	url := birdvisionBaseURL() + path

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, 0, err
		}
		reqBody = bytes.NewReader(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, err
	}

	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		// 如果不是 JSON，直接返回原始内容
		result = map[string]any{"raw": string(data)}
	}

	return result, resp.StatusCode, nil
}

// GET /api/owner/birdvision/stats — 获取 BirdVision 聊天统计
func ownerBirdVisionStatsHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}

	result, status, err := proxyBirdVision("GET", "/admin/chat-stats", nil)
	if err != nil {
		log.Printf("[birdvision] stats error: %v", err)
		writeJSONStatus(w, http.StatusBadGateway, map[string]any{
			"error":   "BIRDVISION_ERROR",
			"message": "无法连接到 BirdVision 服务",
		})
		return
	}

	if status != http.StatusOK {
		writeJSONStatus(w, status, result)
		return
	}

	writeJSON(w, result)
}

// GET /api/owner/birdvision/settings — 获取 BirdVision 所有设置
func ownerBirdVisionSettingsHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}

	result, status, err := proxyBirdVision("GET", "/admin/settings", nil)
	if err != nil {
		log.Printf("[birdvision] settings error: %v", err)
		writeJSONStatus(w, http.StatusBadGateway, map[string]any{
			"error":   "BIRDVISION_ERROR",
			"message": "无法连接到 BirdVision 服务",
		})
		return
	}

	if status != http.StatusOK {
		writeJSONStatus(w, status, result)
		return
	}

	writeJSON(w, result)
}

// POST /api/owner/birdvision/chat-limit — 设置 BirdVision 聊天次数限制
func ownerBirdVisionSetChatLimitHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}

	var body struct {
		Limit int `json:"limit"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_JSON",
			"message": "请求格式不正确",
		})
		return
	}

	if body.Limit < 0 || body.Limit > 9999 {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_LIMIT",
			"message": "limit 范围 0~9999（0=不限制）",
		})
		return
	}

	result, status, err := proxyBirdVision("POST", "/admin/chat-limit", map[string]int{
		"limit": body.Limit,
	})
	if err != nil {
		log.Printf("[birdvision] set chat limit error: %v", err)
		writeJSONStatus(w, http.StatusBadGateway, map[string]any{
			"error":   "BIRDVISION_ERROR",
			"message": "无法连接到 BirdVision 服务",
		})
		return
	}

	if status != http.StatusOK {
		writeJSONStatus(w, status, result)
		return
	}

	log.Printf("[birdvision] chat daily limit changed to %d", body.Limit)
	writeJSON(w, result)
}

// POST /api/owner/birdvision/chat-reset — 重置 BirdVision 今日对话次数
func ownerBirdVisionResetChatHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}

	result, status, err := proxyBirdVision("POST", "/admin/chat-reset", nil)
	if err != nil {
		log.Printf("[birdvision] reset chat error: %v", err)
		writeJSONStatus(w, http.StatusBadGateway, map[string]any{
			"error":   "BIRDVISION_ERROR",
			"message": "无法连接到 BirdVision 服务",
		})
		return
	}

	if status != http.StatusOK {
		writeJSONStatus(w, status, result)
		return
	}

	log.Printf("[birdvision] daily chat quota reset requested")
	writeJSON(w, result)
}