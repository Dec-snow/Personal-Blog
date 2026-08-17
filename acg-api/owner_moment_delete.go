package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

type ownerMomentDeleteRequest struct {
	ID   int64  `json:"id"`
	Year string `json:"year"`
	Date string `json:"date"`
	Type string `json:"type"`
}

type ownerMomentDeleteResult struct {
	Year          string
	Date          string
	Type          string
	Path          string
	CommitSHA     string
	Changed       bool
	CommitMessage string
}

func ownerMomentDeleteHandler(w http.ResponseWriter, r *http.Request) {
	ownerSess, ok := requireOwnerSession(w, r)
	if !ok {
		return
	}

	var body ownerMomentDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_JSON",
			"message": "碎语删除请求格式不正确。",
		})
		return
	}

	year := strings.TrimSpace(body.Year)
	date := strings.TrimSpace(body.Date)
	momentType := strings.TrimSpace(body.Type)

	// Prefer ID-based deletion to avoid deleting multiple moments that share year/date/type.
	if body.ID > 0 {
		// Get image URL before deleting from DB
		imageURL, _ := getMomentImageURLByID(body.ID)
		if imageURL != "" {
			go deleteMomentImageFromCOS(imageURL)
		}

		deleted, err := deleteMomentByID(body.ID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if !deleted {
			writeJSONStatus(w, http.StatusNotFound, map[string]any{
				"error":   "MOMENT_NOT_FOUND",
				"message": "未找到对应的碎语记录。",
			})
			return
		}
		writeJSON(w, map[string]any{
			"ok": true,
			"item": map[string]any{
				"id":      body.ID,
				"year":    year,
				"date":    date,
				"type":    momentType,
				"changed": true,
			},
			"owner": map[string]any{
				"email":       ownerSess.Email,
				"displayName": ownerSess.DisplayName,
			},
		})
		return
	}

	if year == "" || date == "" || momentType == "" {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_MOMENT_DELETE",
			"message": "删除碎语需要提供年份、日期和分类。",
		})
		return
	}

	// Get image URL before deleting from DB
	imageURL, _ := getMomentImageURLByYearDateType(year, date, momentType)
	if imageURL != "" {
		go deleteMomentImageFromCOS(imageURL)
	}

	deleted, err := deleteMomentFromDB(year, date, momentType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if !deleted {
		writeJSONStatus(w, http.StatusNotFound, map[string]any{
			"error":   "MOMENT_NOT_FOUND",
			"message": "未找到对应的碎语记录。",
		})
		return
	}

	writeJSON(w, map[string]any{
		"ok": true,
		"item": map[string]any{
			"year":    year,
			"date":    date,
			"type":    momentType,
			"changed": true,
		},
		"owner": map[string]any{
			"email":       ownerSess.Email,
			"displayName": ownerSess.DisplayName,
		},
	})
}

// deleteMomentImageFromCOS deletes the moment's image from Tencent COS asynchronously.
// It silently ignores errors — the database record is already deleted,
// and a stray image on COS is harmless (can be cleaned up manually if needed).
func deleteMomentImageFromCOS(imageURL string) {
	if imageURL == "" {
		return
	}
	uploader, err := newOwnerAssetUploader()
	if err != nil {
		log.Printf("[moments] skip COS image delete: uploader not available: %v", err)
		return
	}
	cfg, err := loadOwnerCOSConfig()
	if err != nil {
		log.Printf("[moments] skip COS image delete: config load failed: %v", err)
		return
	}
	objectKey := ownerCOSObjectKeyFromURL(cfg, imageURL)
	if objectKey == "" {
		// Not our COS image (e.g. external URL) — skip silently
		return
	}
	if err := uploader.DeleteImage(objectKey); err != nil {
		log.Printf("[moments] failed to delete image from COS (%s): %v", objectKey, err)
	} else {
		log.Printf("[moments] deleted image from COS: %s", objectKey)
	}
}
