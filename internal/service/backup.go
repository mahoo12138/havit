package service

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/mahoo12138/havit/internal/storage"
)

type BackupService struct {
	db          *sql.DB
	dataDir     string
	keepDays    int
	attachments *AttachmentService
	runMu       sync.Mutex
}

func NewBackupService(db *sql.DB, dataDir string, keepDays int, attachments *AttachmentService) *BackupService {
	return &BackupService{db: db, dataDir: dataDir, keepDays: keepDays, attachments: attachments}
}

type BackupResult struct {
	Path      string `json:"path"`
	Size      int64  `json:"size"`
	CreatedAt int64  `json:"created_at"`
}

func (s *BackupService) Run(ctx context.Context) (*BackupResult, error) {
	s.runMu.Lock()
	defer s.runMu.Unlock()

	backupDir := filepath.Join(s.dataDir, "backups")
	if err := os.MkdirAll(backupDir, 0o755); err != nil {
		return nil, err
	}

	timestamp := time.Now().Format("2006-01-02T150405")
	tempDB := filepath.Join(backupDir, "temp_backup.db")
	finalTar := filepath.Join(backupDir, fmt.Sprintf("%s_havit.tar.gz", timestamp))
	tempTar := finalTar + ".tmp"
	_ = os.Remove(tempDB)
	_ = os.Remove(tempTar)

	escaped := strings.ReplaceAll(tempDB, "'", "''")
	if _, err := s.db.ExecContext(ctx, fmt.Sprintf("VACUUM INTO '%s'", escaped)); err != nil {
		return nil, fmt.Errorf("vacuum into: %w", err)
	}
	defer os.Remove(tempDB)
	defer os.Remove(tempTar)

	entries := []backupEntry{
		{path: tempDB, name: "havit.db"},
	}
	configPath := filepath.Join(s.dataDir, "config.yaml")
	if _, err := os.Stat(configPath); err == nil {
		entries = append(entries, backupEntry{path: configPath, name: "config.yaml"})
	} else if !os.IsNotExist(err) {
		return nil, fmt.Errorf("stat config for backup: %w", err)
	}

	// Attachment payloads are streamed from the active object store (local
	// dir or S3) rather than walked off disk, so backups are complete in
	// both storage modes and produce the same archive layout either way.
	if err := createTarGz(tempTar, entries, func(tw *tar.Writer) error {
		return s.writeAttachmentsToTar(ctx, tw)
	}); err != nil {
		return nil, fmt.Errorf("tar: %w", err)
	}
	if err := os.Rename(tempTar, finalTar); err != nil {
		return nil, fmt.Errorf("finalize backup: %w", err)
	}
	if err := os.Chmod(finalTar, 0o600); err != nil {
		return nil, fmt.Errorf("restrict backup permissions: %w", err)
	}

	if err := s.pruneOldBackups(); err != nil {
		return nil, err
	}

	info, err := os.Stat(finalTar)
	if err != nil {
		return nil, err
	}
	return &BackupResult{
		Path:      finalTar,
		Size:      info.Size(),
		CreatedAt: time.Now().Unix(),
	}, nil
}

func (s *BackupService) StartScheduler(ctx context.Context, cronExpr string) {
	go func() {
		for {
			next, err := nextBackupRun(time.Now(), cronExpr)
			if err != nil {
				slog.Error("backup scheduler disabled", "err", err)
				return
			}
			timer := time.NewTimer(time.Until(next))
			select {
			case <-timer.C:
				if _, err := s.Run(ctx); err != nil {
					slog.Error("scheduled backup failed", "err", err)
				}
			case <-ctx.Done():
				timer.Stop()
				return
			}
		}
	}()
}

func nextBackupRun(now time.Time, cronExpr string) (time.Time, error) {
	parts := strings.Fields(cronExpr)
	if len(parts) != 5 {
		return time.Time{}, fmt.Errorf("backup cron must have 5 fields")
	}
	if parts[2] != "*" || parts[3] != "*" || parts[4] != "*" {
		return time.Time{}, fmt.Errorf("backup cron supports daily schedules only")
	}
	minute, err := parseCronNumber(parts[0], 0, 59)
	if err != nil {
		return time.Time{}, fmt.Errorf("backup cron minute: %w", err)
	}
	hour, err := parseCronNumber(parts[1], 0, 23)
	if err != nil {
		return time.Time{}, fmt.Errorf("backup cron hour: %w", err)
	}
	next := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, now.Location())
	if !next.After(now) {
		next = next.Add(24 * time.Hour)
	}
	return next, nil
}

func parseCronNumber(raw string, minValue, maxValue int) (int, error) {
	value, err := strconv.Atoi(raw)
	if err != nil {
		return 0, err
	}
	if value < minValue || value > maxValue {
		return 0, fmt.Errorf("value %d outside %d..%d", value, minValue, maxValue)
	}
	return value, nil
}

func (s *BackupService) pruneOldBackups() error {
	if s.keepDays <= 0 {
		return nil
	}
	backupDir := filepath.Join(s.dataDir, "backups")
	entries, err := os.ReadDir(backupDir)
	if err != nil {
		return err
	}
	cutoff := time.Now().Add(-time.Duration(s.keepDays) * 24 * time.Hour)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), "_havit.tar.gz") {
			continue
		}
		path := filepath.Join(backupDir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if info.ModTime().Before(cutoff) {
			if err := os.Remove(path); err != nil {
				return err
			}
		}
	}
	return nil
}

type backupEntry struct {
	path string
	name string
}

func createTarGz(output string, entries []backupEntry, attachments func(*tar.Writer) error) (err error) {
	file, err := os.Create(output)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = os.Remove(output)
		}
	}()

	gz := gzip.NewWriter(file)
	tw := tar.NewWriter(gz)

	for _, entry := range entries {
		if _, err := os.Stat(entry.path); os.IsNotExist(err) {
			continue
		} else if err != nil {
			_ = tw.Close()
			_ = gz.Close()
			_ = file.Close()
			return err
		}
		if err := addPathToTar(tw, entry.path, entry.name); err != nil {
			_ = tw.Close()
			_ = gz.Close()
			_ = file.Close()
			return err
		}
	}
	if attachments != nil {
		if err := attachments(tw); err != nil {
			_ = tw.Close()
			_ = gz.Close()
			_ = file.Close()
			return err
		}
	}
	if err := tw.Close(); err != nil {
		_ = gz.Close()
		_ = file.Close()
		return err
	}
	if err := gz.Close(); err != nil {
		_ = file.Close()
		return err
	}
	return file.Close()
}

// writeAttachmentsToTar streams every attachment record from the object
// store. The archive name equals the stored key (attachments/<item>/...),
// matching the on-disk layout a restore expects. Records whose object is
// missing are skipped with a warning instead of failing the whole backup.
func (s *BackupService) writeAttachmentsToTar(ctx context.Context, tw *tar.Writer) error {
	rows, err := s.db.QueryContext(ctx, `SELECT path, created_at FROM attachments ORDER BY item_id, path`)
	if err != nil {
		return fmt.Errorf("list attachments for backup: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var key string
		var createdAt int64
		if err := rows.Scan(&key, &createdAt); err != nil {
			return err
		}
		content, err := s.attachments.OpenByPath(ctx, key)
		if err != nil {
			if errors.Is(err, storage.ErrNotFound) {
				slog.Warn("skipping missing attachment object in backup", "path", key)
				continue
			}
			return fmt.Errorf("open attachment %s for backup: %w", key, err)
		}
		// The tar writer needs the size up front; derive it by seeking
		// since both the local file and the S3 reader support seeking.
		size, err := content.Seek(0, io.SeekEnd)
		if err == nil {
			_, err = content.Seek(0, io.SeekStart)
		}
		if err != nil {
			_ = content.Close()
			return fmt.Errorf("measure attachment %s: %w", key, err)
		}
		header := &tar.Header{
			Name:    key,
			Mode:    0o644,
			Size:    size,
			ModTime: unixModTime(createdAt),
		}
		if err := tw.WriteHeader(header); err != nil {
			_ = content.Close()
			return err
		}
		if _, err := io.Copy(tw, content); err != nil {
			_ = content.Close()
			return fmt.Errorf("pack attachment %s: %w", key, err)
		}
		if err := content.Close(); err != nil {
			return fmt.Errorf("close attachment %s: %w", key, err)
		}
	}
	return rows.Err()
}

func unixModTime(ts int64) time.Time {
	if ts <= 0 {
		return time.Time{}
	}
	return time.Unix(ts, 0)
}

func addPathToTar(tw *tar.Writer, src, name string) error {
	return filepath.WalkDir(src, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		info, err := d.Info()
		if err != nil {
			return err
		}
		header, err := tar.FileInfoHeader(info, "")
		if err != nil {
			return err
		}
		rel := name
		if path != src {
			child, err := filepath.Rel(src, path)
			if err != nil {
				return err
			}
			rel = filepath.ToSlash(filepath.Join(name, child))
		}
		header.Name = rel
		if err := tw.WriteHeader(header); err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		_, err = io.Copy(tw, file)
		return err
	})
}
