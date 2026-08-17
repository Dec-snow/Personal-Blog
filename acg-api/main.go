package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime/debug"
	"strings"
	"syscall"
	"time"

	_ "modernc.org/sqlite"
)

var db *sql.DB

func main() {
	loadOptionalEnvFiles("/opt/acg-api/.env", ".env")

	addr := env("ACG_API_ADDR", ":8787")
	dataDir := env("ACG_DATA_DIR", "./data")
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		log.Fatalf("cannot create data dir %s: %v", dataDir, err)
	}

	var err error
	db, err = sql.Open("sqlite", filepath.Join(dataDir, "acg.db")+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		log.Fatal(err)
	}
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(0)
	if err := migrateAll(db); err != nil {
		log.Fatal(err)
	}
	ensureOwnerAccount(db)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, _ *http.Request) {
		dbStatus := "ok"
		if err := db.Ping(); err != nil {
			dbStatus = "degraded"
		}
		writeJSON(w, map[string]string{"status": dbStatus})
	})
	mux.HandleFunc("/api/server/info", serverInfoHandler)
	mux.HandleFunc("/api/auth/", authHandler)
	mux.HandleFunc("/api/owner/", ownerRouter)
	mux.HandleFunc("/api/moments", momentsPublicHandler)

	log.Printf("acg-api on %s\n", addr)

	srv := &http.Server{
		Addr:         addr,
		Handler:      withCORS(withRecovery(mux)),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("server shutting down: %v", <-ctx.Done())
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("shutdown error: %v", err)
		}
		if err := db.Close(); err != nil {
			log.Printf("db close error: %v", err)
		}
	}()

	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if origin := allowedCORSOrigin(r.Header.Get("Origin")); origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Add("Vary", "Origin")
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept, X-Blog-User-Id, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func allowedCORSOrigin(origin string) string {
	origin = strings.TrimSpace(origin)
	if origin == "" {
		return ""
	}
	for _, allowed := range configuredCORSOrigins() {
		if strings.EqualFold(origin, allowed) {
			return origin
		}
	}
	return ""
}

func configuredCORSOrigins() []string {
	raw := strings.TrimSpace(env("ACG_ALLOWED_ORIGINS", "https://hoarfrost.cloud,https://www.hoarfrost.cloud,http://localhost:5173,http://127.0.0.1:5173"))
	if raw == "" {
		return nil
	}
	parts := strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == ' ' || r == '\n' || r == '\t'
	})
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		if origin := strings.TrimSpace(part); origin != "" {
			origins = append(origins, origin)
		}
	}
	return origins
}

func withRecovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic: %v\n%s", rec, debug.Stack())
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func serverError(w http.ResponseWriter, err error) {
	log.Printf("server error: %v", err)
	http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	enc := json.NewEncoder(w)
	_ = enc.Encode(v)
}
