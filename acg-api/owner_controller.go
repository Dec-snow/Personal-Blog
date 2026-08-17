package main

import (
	"database/sql"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	ownerUploadMaxBytes   = 8 * 1024 * 1024
	ownerDraftTitleMax    = 120
	ownerDraftBodyMax     = 200000
	ownerLatestDraftLimit = 20
)

var ownerAssetUploadFactory = newOwnerAssetUploader

type ownerAuthedSession struct {
	Session     sessionInfo
	UserID      int64
	Email       string
	DisplayName string
}

type ownerDraftRow struct {
	ID        int64  `json:"id"`
	Kind      string `json:"kind"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	CoverURL  string `json:"coverUrl"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

func ownerRouter(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/owner/")
	path = strings.Trim(path, "/")

	switch {
	case path == "status":
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		ownerStatusHandler(w, r)
		return
	case path == "emails":
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		ownerEmailDirectoryHandler(w, r)
		return
	case path == "drafts":
		switch r.Method {
		case http.MethodGet:
			ownerDraftListHandler(w, r)
		case http.MethodPost:
			ownerDraftCreateHandler(w, r)
		default:
			methodNotAllowed(w)
		}
		return
	case path == "moments":
		switch r.Method {
		case http.MethodPost:
			ownerMomentPublishHandler(w, r)
		case http.MethodDelete:
			ownerMomentDeleteHandler(w, r)
		default:
			methodNotAllowed(w)
		}
		return
	case strings.HasPrefix(path, "notifications/") && strings.HasSuffix(path, "/read"):
		if r.Method != http.MethodPatch {
			methodNotAllowed(w)
			return
		}
		idText := strings.TrimSuffix(strings.TrimPrefix(path, "notifications/"), "/read")
		id, err := strconv.ParseInt(strings.Trim(idText, "/"), 10, 64)
		if err != nil || id <= 0 {
			writeJSONStatus(w, http.StatusNotFound, map[string]any{
				"error":   "NOT_FOUND",
				"message": "提醒不存在。",
			})
			return
		}
		ownerNotificationReadHandler(w, r, id)
		return
	case path == "uploads":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		ownerUploadCreateHandler(w, r)
		return
	case path == "assets":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		ownerAssetCreateHandler(w, r)
		return
	case path == "publish":
		if r.Method != http.MethodPost {
			methodNotAllowed(w)
			return
		}
		ownerPublishHandler(w, r)
		return
	case strings.HasPrefix(path, "uploads/"):
		if r.Method != http.MethodGet {
			methodNotAllowed(w)
			return
		}
		ownerUploadServeHandler(w, r, strings.TrimPrefix(path, "uploads/"))
		return
	default:
		http.NotFound(w, r)
	}
}

func requireOwnerSession(w http.ResponseWriter, r *http.Request) (ownerAuthedSession, bool) {
	sess, ok := sessionFromRequest(r)
	if !ok {
		writeJSONStatus(w, http.StatusUnauthorized, map[string]any{
			"error":   "UNAUTHORIZED",
			"message": "请先登录。",
		})
		return ownerAuthedSession{}, false
	}

	var (
		email       string
		displayName string
		isOwner     int
	)
	err := db.QueryRow(
		`SELECT email, display_name, is_owner FROM users WHERE id = ?`,
		sess.UserID,
	).Scan(&email, &displayName, &isOwner)
	if err == sql.ErrNoRows {
		writeJSONStatus(w, http.StatusUnauthorized, map[string]any{
			"error":   "UNAUTHORIZED",
			"message": "登录会话对应的用户不存在。",
		})
		return ownerAuthedSession{}, false
	}
	if err != nil {
		serverError(w, err)
		return ownerAuthedSession{}, false
	}
	if isOwner != 1 || !sess.Unlimited {
		writeJSONStatus(w, http.StatusForbidden, map[string]any{
			"error":   "FORBIDDEN",
			"message": "需要站长权限。",
		})
		return ownerAuthedSession{}, false
	}

	return ownerAuthedSession{
		Session:     sess,
		UserID:      sess.UserID,
		Email:       email,
		DisplayName: displayNameOrEmail(email, displayName),
	}, true
}

func ownerStatusHandler(w http.ResponseWriter, r *http.Request) {
	ownerSess, ok := requireOwnerSession(w, r)
	if !ok {
		return
	}

	totalUsers, err := ownerUserTotal()
	if err != nil {
		serverError(w, err)
		return
	}
	registeredTotal, err := ownerRegisteredUserTotal()
	if err != nil {
		serverError(w, err)
		return
	}
	drafts, err := listOwnerDrafts(ownerLatestDraftLimit)
	if err != nil {
		serverError(w, err)
		return
	}

	writeJSON(w, map[string]any{
		"owner": map[string]any{
			"id":          ownerSess.UserID,
			"email":       ownerSess.Email,
			"displayName": ownerSess.DisplayName,
		},
		"users": map[string]any{
			"total":           totalUsers,
			"registeredTotal": registeredTotal,
		},
		"uploads": map[string]any{
			"maxBytes": ownerUploadMaxBytes,
			"baseURL":  "/api/owner/uploads/",
		},
		"drafts": map[string]any{
			"total": len(drafts),
			"items": drafts,
		},
	})
}

func ownerEmailDirectoryHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}

	registeredUsers, err := ownerRegisteredUsers()
	if err != nil {
		serverError(w, err)
		return
	}

	writeJSON(w, map[string]any{
		"registeredUsers": registeredUsers,
	})
}

func ownerDraftListHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}
	items, err := listOwnerDrafts(ownerLatestDraftLimit)
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, map[string]any{
		"items": items,
		"total": len(items),
	})
}

func ownerDraftCreateHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}

	var body struct {
		Kind     string `json:"kind"`
		Title    string `json:"title"`
		Body     string `json:"body"`
		CoverURL string `json:"coverUrl"`
		Status   string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_JSON",
			"message": "请求内容格式不正确。",
		})
		return
	}

	kind := strings.TrimSpace(body.Kind)
	if kind == "" {
		kind = "article"
	}
	title := strings.TrimSpace(body.Title)
	if title == "" {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_TITLE",
			"message": "草稿标题不能为空。",
		})
		return
	}
	if len([]rune(title)) > ownerDraftTitleMax {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_TITLE",
			"message": "草稿标题太长。",
		})
		return
	}
	if len(body.Body) > ownerDraftBodyMax {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_BODY",
			"message": "草稿正文太大。",
		})
		return
	}

	status := strings.TrimSpace(body.Status)
	if status == "" {
		status = "draft"
	}
	now := time.Now().UTC().Format(time.RFC3339)
	res, err := db.Exec(
		`INSERT INTO owner_drafts (kind, title, body, cover_url, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		kind,
		title,
		body.Body,
		strings.TrimSpace(body.CoverURL),
		status,
		now,
		now,
	)
	if err != nil {
		serverError(w, err)
		return
	}
	id, err := res.LastInsertId()
	if err != nil {
		serverError(w, err)
		return
	}

	writeJSON(w, map[string]any{
		"ok": true,
		"item": ownerDraftRow{
			ID:        id,
			Kind:      kind,
			Title:     title,
			Body:      body.Body,
			CoverURL:  strings.TrimSpace(body.CoverURL),
			Status:    status,
			CreatedAt: now,
			UpdatedAt: now,
		},
	})
}

func ownerNotificationReadHandler(w http.ResponseWriter, r *http.Request, id int64) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}
	writeJSONStatus(w, http.StatusNotFound, map[string]any{
		"error":   "NOT_FOUND",
		"message": "提醒不存在。",
	})
}

func ownerUploadCreateHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}

	if err := os.MkdirAll(ownerUploadsDir(), 0o755); err != nil {
		serverError(w, err)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, ownerUploadMaxBytes+1024*1024)
	if err := r.ParseMultipartForm(ownerUploadMaxBytes + 1024*1024); err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_UPLOAD",
			"message": "上传表单解析失败。",
		})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "MISSING_FILE",
			"message": "请选择要上传的文件。",
		})
		return
	}
	defer file.Close()

	if header.Size > ownerUploadMaxBytes {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "FILE_TOO_LARGE",
			"message": "上传文件超过 8 MiB 限制。",
		})
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !ownerUploadExtAllowed(ext) {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_FILE_TYPE",
			"message": "当前只支持上传图片。",
		})
		return
	}

	buf, err := io.ReadAll(io.LimitReader(file, ownerUploadMaxBytes+1))
	if err != nil {
		serverError(w, err)
		return
	}
	if int64(len(buf)) > ownerUploadMaxBytes {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "FILE_TOO_LARGE",
			"message": "上传文件超过 8 MiB 限制。",
		})
		return
	}
	if !strings.HasPrefix(http.DetectContentType(buf), "image/") {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_FILE_TYPE",
			"message": "当前只支持上传图片。",
		})
		return
	}

	name := ownerUploadFilename(ext)
	target := filepath.Join(ownerUploadsDir(), name)
	if err := os.WriteFile(target, buf, 0o644); err != nil {
		serverError(w, err)
		return
	}

	writeJSON(w, map[string]any{
		"ok": true,
		"item": map[string]any{
			"name":     name,
			"url":      "/api/owner/uploads/" + name,
			"size":     len(buf),
			"mimeType": http.DetectContentType(buf),
		},
	})
}

func ownerAssetCreateHandler(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireOwnerSession(w, r); !ok {
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, ownerUploadMaxBytes+1024*1024)
	if err := r.ParseMultipartForm(ownerUploadMaxBytes + 1024*1024); err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_UPLOAD",
			"message": "上传表单解析失败。",
		})
		return
	}

	kind := strings.TrimSpace(r.FormValue("kind"))
	if kind != "gallery" && kind != "article" && kind != "moment" {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_ASSET_KIND",
			"message": "资源类型必须是相册、文章或随笔。",
		})
		return
	}

	album := strings.TrimSpace(r.FormValue("album"))
	if kind == "gallery" && album == "" {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_ALBUM",
			"message": "相册上传必须选择相册。",
		})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "MISSING_FILE",
			"message": "请选择要上传的文件。",
		})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !ownerUploadExtAllowed(ext) {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_FILE_TYPE",
			"message": "当前只支持上传图片。",
		})
		return
	}

	buf, err := io.ReadAll(io.LimitReader(file, ownerUploadMaxBytes+1))
	if err != nil {
		serverError(w, err)
		return
	}
	if int64(len(buf)) > ownerUploadMaxBytes {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "FILE_TOO_LARGE",
			"message": "上传文件超过 8 MiB 限制。",
		})
		return
	}

	mimeType := http.DetectContentType(buf)
	if !strings.HasPrefix(mimeType, "image/") {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_FILE_TYPE",
			"message": "当前只支持上传图片。",
		})
		return
	}

	uploader, err := ownerAssetUploadFactory()
	if err != nil {
		writeJSONStatus(w, http.StatusServiceUnavailable, map[string]any{
			"error":   "ASSET_UPLOAD_NOT_CONFIGURED",
			"message": "腾讯 COS 上传尚未配置。",
		})
		return
	}

	name := ownerUploadFilename(ext)
	item, err := uploader.UploadImage(r.Context(), kind, album, name, mimeType, buf)
	if err != nil {
		writeJSONStatus(w, http.StatusBadGateway, map[string]any{
			"error":   "ASSET_UPLOAD_FAILED",
			"message": "无法上传资源到腾讯 COS。",
		})
		return
	}

	writeJSON(w, map[string]any{
		"ok": true,
		"item": map[string]any{
			"kind":     kind,
			"url":      item.URL,
			"path":     item.ObjectKey,
			"mimeType": item.MIMEType,
			"size":     item.Size,
		},
	})
}

func ownerUploadServeHandler(w http.ResponseWriter, r *http.Request, name string) {
	if name == "" || strings.Contains(name, "/") || strings.Contains(name, `\`) {
		http.NotFound(w, r)
		return
	}
	target := filepath.Join(ownerUploadsDir(), filepath.Base(name))
	http.ServeFile(w, r, target)
}

func ownerUserTotal() (int, error) {
	var total int
	err := db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&total)
	return total, err
}

func ownerRegisteredUserTotal() (int, error) {
	var total int
	err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE is_owner = 0`).Scan(&total)
	return total, err
}

func ownerRegisteredUsers() ([]map[string]any, error) {
	rows, err := db.Query(
		`SELECT id, email, display_name, created_at
		 FROM users
		 WHERE is_owner = 0
		 ORDER BY id DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]map[string]any, 0)
	for rows.Next() {
		var id int64
		var email, displayName, createdAt string
		if err := rows.Scan(&id, &email, &displayName, &createdAt); err != nil {
			return nil, err
		}
		items = append(items, map[string]any{
			"id":          id,
			"email":       email,
			"displayName": displayNameOrEmail(email, displayName),
			"createdAt":   createdAt,
		})
	}
	return items, rows.Err()
}

func listOwnerDrafts(limit int) ([]ownerDraftRow, error) {
	rows, err := db.Query(
		`SELECT id, kind, title, body, cover_url, status, created_at, updated_at
		 FROM owner_drafts
		 ORDER BY updated_at DESC, id DESC
		 LIMIT ?`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ownerDraftRow, 0, limit)
	for rows.Next() {
		var item ownerDraftRow
		if err := rows.Scan(
			&item.ID,
			&item.Kind,
			&item.Title,
			&item.Body,
			&item.CoverURL,
			&item.Status,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func ownerUploadsDir() string {
	return filepath.Join(env("ACG_DATA_DIR", "./data"), "owner-uploads")
}

func ownerUploadExtAllowed(ext string) bool {
	switch ext {
	case ".png", ".jpg", ".jpeg", ".webp", ".gif":
		return true
	default:
		return false
	}
}

func ownerUploadFilename(ext string) string {
	return time.Now().UTC().Format("20060102-150405") + "-" + uuid.NewString() + ext
}

func ownerUploadMIMEFromHeader(header *multipart.FileHeader) string {
	if header == nil {
		return ""
	}
	return header.Header.Get("Content-Type")
}
