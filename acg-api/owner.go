package main

import (
	"database/sql"
	"log"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const (
	ownerSecurityQuestion = "你现在的学号"
)

func ownerEmail() string {
	if email := strings.TrimSpace(os.Getenv("AUTH_OWNER_EMAIL")); email != "" {
		return email
	}
	return "2486854490@qq.com" // fallback
}

func isOwnerEmail(email string) bool {
	return normalizeEmail(email) == ownerEmail()
}

func ownerSecurityAnswer() string {
	return strings.TrimSpace(os.Getenv("AUTH_OWNER_SECURITY_ANSWER"))
}

func ownerAnswerMatches(answer string) bool {
	return strings.TrimSpace(answer) == strings.TrimSpace(ownerSecurityAnswer())
}

// ensureOwnerAccount reserves the owner mailbox (no public registration).
// When the owner already exists, it re-hashes the password if AUTH_OWNER_PASSWORD
// changed in .env, so the owner always logs in with the current configured password.
func ensureOwnerAccount(db *sql.DB) {
	pw := strings.TrimSpace(os.Getenv("AUTH_OWNER_PASSWORD"))
	if pw == "" {
		log.Printf("WARN: AUTH_OWNER_PASSWORD not set; owner %s cannot log in until set in .env", ownerEmail())
		return
	}
	if len(pw) < 8 {
		log.Printf("WARN: AUTH_OWNER_PASSWORD too short (min 8)")
		return
	}

	var id int64
	var currentHash string
	err := db.QueryRow(`SELECT id, password_hash FROM users WHERE email = ?`, ownerEmail()).Scan(&id, &currentHash)
	if err == nil {
		// Update is_owner flag and re-hash password when .env changed.
		needRehash := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(pw)) != nil
		if needRehash {
			hash, hashErr := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
			if hashErr != nil {
				log.Printf("owner password rehash: %v", hashErr)
				return
			}
			_, _ = db.Exec(`UPDATE users SET password_hash = ?, is_owner = 1 WHERE id = ?`, string(hash), id)
			log.Printf("owner password updated for %s (AUTH_OWNER_PASSWORD changed)", ownerEmail())
		} else {
			_, _ = db.Exec(`UPDATE users SET is_owner = 1 WHERE id = ?`, id)
		}
		return
	}
	if err != sql.ErrNoRows {
		log.Printf("owner account check: %v", err)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("owner password hash: %v", err)
		return
	}
	created := time.Now().UTC().Format(time.RFC3339)
	_, err = db.Exec(
		`INSERT INTO users (email, password_hash, created_at, is_owner) VALUES (?, ?, ?, 1)`,
		ownerEmail(), string(hash), created,
	)
	if err != nil {
		log.Printf("create owner account: %v", err)
		return
	}
	log.Printf("owner account ready for %s (set AUTH_OWNER_PASSWORD in .env to log in)", ownerEmail())
}
