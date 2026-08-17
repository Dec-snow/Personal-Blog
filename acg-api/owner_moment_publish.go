package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var (
	ownerMomentYearPattern = regexp.MustCompile(`^\d{4}$`)
	ownerMomentDatePattern = regexp.MustCompile(`^\d{1,2}\.\d{1,2}$`)
)

type ownerMomentPublishRequest struct {
	Year     string `json:"year"`
	Date     string `json:"date"`
	Type     string `json:"type"`
	Category string `json:"category"`
	Content  string `json:"content"`
	ImageURL string `json:"imageUrl"`
	ImageAlt string `json:"imageAlt"`
}

type ownerMomentPublishResult struct {
	Year          string
	Date          string
	Type          string
	Path          string
	CommitSHA     string
	Changed       bool
	CommitMessage string
}

func ownerMomentPublishHandler(w http.ResponseWriter, r *http.Request) {
	ownerSess, ok := requireOwnerSession(w, r)
	if !ok {
		return
	}

	var body ownerMomentPublishRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("[moments] JSON decode error: %v", err)
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_JSON",
			"message": "碎语发布请求格式不正确。",
		})
		return
	}

	year := strings.TrimSpace(body.Year)
	if year == "" {
		year = ownerMomentDefaultYear(time.Now())
	}
	if !ownerMomentYearPattern.MatchString(year) {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_MOMENT_YEAR",
			"message": "碎语年份格式应为 2026 这样的四位年份",
		})
		return
	}

	date := strings.TrimSpace(body.Date)
	if date == "" {
		date = ownerMomentDefaultDate(time.Now())
	}
	if !ownerMomentDatePattern.MatchString(date) {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_MOMENT_DATE",
			"message": "碎语日期格式应为 6.8 这样的月.日",
		})
		return
	}

	momentType := strings.TrimSpace(body.Type)
	if momentType == "" {
		momentType = strings.TrimSpace(body.Category)
	}
	if momentType == "" {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_MOMENT_TYPE",
			"message": "碎语分类不能为空",
		})
		return
	}

	lines := ownerMomentContentLines(body.Content)
	if len(lines) == 0 {
		writeJSONStatus(w, http.StatusBadRequest, map[string]any{
			"error":   "INVALID_MOMENT_CONTENT",
			"message": "碎语内容不能为空",
		})
		return
	}

	linesJSON, _ := json.Marshal(lines)
	imageURL := strings.TrimSpace(body.ImageURL)
	imageAlt := strings.TrimSpace(body.ImageAlt)
	if imageURL != "" && imageAlt == "" {
		imageAlt = momentType
	}

	tone, module := ownerNextMomentStyleFromCount(ownerMomentCount())
	sortOrder := ownerMomentDateOrder(year, date)
	now := time.Now().UTC().Format(time.RFC3339)

	result, err := db.Exec(
		`INSERT INTO moments (year, date, type, lines, image_url, image_alt, tone, module, sort_order, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		year, date, momentType, string(linesJSON), imageURL, imageAlt, tone, module, sortOrder, now,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	writeJSON(w, map[string]any{
		"ok": true,
		"item": map[string]any{
			"id":            id,
			"year":          year,
			"date":          date,
			"type":          momentType,
			"lines":         lines,
			"imageUrl":      imageURL,
			"imageAlt":      imageAlt,
			"tone":          tone,
			"module":        module,
			"commitMessage": ownerMomentPublishCommitMessage(year, date),
		},
		"owner": map[string]any{
			"email":       ownerSess.Email,
			"displayName": ownerSess.DisplayName,
		},
	})
}

func ownerMomentContentLines(content string) []string {
	normalized := strings.ReplaceAll(content, "\r\n", "\n")
	rawLines := strings.Split(normalized, "\n")
	lines := make([]string, 0, len(rawLines))
	for _, line := range rawLines {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			lines = append(lines, trimmed)
		}
	}
	return lines
}

func ownerMomentCount() int {
	var count int
	_ = db.QueryRow(`SELECT COUNT(*) FROM moments`).Scan(&count)
	return count
}

func ownerNextMomentStyleFromCount(count int) (string, string) {
	tones := []string{"aurora", "ticket", "watercolor", "mist", "journal", "mint"}
	modules := []string{"postcard", "ticket", "watercolor", "poem", "journal", "ribbon"}
	return tones[count%len(tones)], modules[count%len(modules)]
}

func ownerMomentDateOrder(year, date string) int {
	parts := strings.Split(date, ".")
	if len(parts) != 2 {
		return 0
	}
	yearNumber, _ := strconv.Atoi(year)
	month, _ := strconv.Atoi(parts[0])
	day, _ := strconv.Atoi(parts[1])
	return yearNumber*10000 + month*100 + day
}

func ownerMomentDefaultDate(now time.Time) string {
	siteNow := now.UTC().Add(8 * time.Hour)
	return fmt.Sprintf("%d.%d", int(siteNow.Month()), siteNow.Day())
}

func ownerMomentDefaultYear(now time.Time) string {
	siteNow := now.UTC().Add(8 * time.Hour)
	return strconv.Itoa(siteNow.Year())
}

func ownerMomentPublishCommitMessage(year, date string) string {
	return "feat: publish moment " + year + "-" + date + " " + time.Now().UTC().Format("20060102-150405")
}

// listMomentsFromDB returns all moments ordered by date descending.
func listMomentsFromDB() ([]map[string]any, error) {
	rows, err := db.Query(
		`SELECT id, year, date, type, lines, image_url, image_alt, tone, module
		 FROM moments
		 ORDER BY sort_order DESC, id DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]map[string]any, 0)
	for rows.Next() {
		var id int64
		var year, date, momentType, linesJSON, imageURL, imageAlt, tone, module string
		if err := rows.Scan(&id, &year, &date, &momentType, &linesJSON, &imageURL, &imageAlt, &tone, &module); err != nil {
			return nil, err
		}

		var lines []string
		_ = json.Unmarshal([]byte(linesJSON), &lines)
		if lines == nil {
			lines = []string{}
		}

		item := map[string]any{
			"id":     id,
			"year":   year,
			"date":   date,
			"type":   momentType,
			"tone":   tone,
			"module": module,
			"lines":  lines,
		}
		if imageURL != "" {
			item["image"] = map[string]any{
				"src": imageURL,
				"alt": imageAlt,
			}
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// deleteMomentFromDB deletes a moment by year/date/type.
func deleteMomentFromDB(year, date, momentType string) (bool, error) {
	res, err := db.Exec(
		`DELETE FROM moments WHERE year = ? AND date = ? AND type = ?`,
		year, date, momentType,
	)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// deleteMomentByID deletes a single moment by its primary key.
func deleteMomentByID(id int64) (bool, error) {
	res, err := db.Exec(`DELETE FROM moments WHERE id = ?`, id)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// getMomentImageURLByID retrieves the image_url of a moment by its ID.
func getMomentImageURLByID(id int64) (string, error) {
	var imageURL string
	err := db.QueryRow(`SELECT image_url FROM moments WHERE id = ?`, id).Scan(&imageURL)
	if err != nil {
		return "", err
	}
	return imageURL, nil
}

// getMomentImageURLByYearDateType retrieves the image_url of a moment by year/date/type.
func getMomentImageURLByYearDateType(year, date, momentType string) (string, error) {
	var imageURL string
	err := db.QueryRow(
		`SELECT image_url FROM moments WHERE year = ? AND date = ? AND type = ? LIMIT 1`,
		year, date, momentType,
	).Scan(&imageURL)
	if err != nil {
		return "", err
	}
	return imageURL, nil
}

// momentsPublicHandler returns all published moments for the public frontend.
func momentsPublicHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	items, err := listMomentsFromDB()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{
		"items":   items,
		"total":   len(items),
	})
}
