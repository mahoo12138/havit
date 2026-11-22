package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/oklog/ulid/v2"

	"github.com/mahoo12138/havit/internal/model"
	"github.com/mahoo12138/havit/internal/storage"

	apperr "github.com/mahoo12138/havit/internal/errors"
)

var ErrAISourceProtected = apperr.ErrAISourceProtected

type AttachmentService struct {
	db        *sql.DB
	primary   storage.Store
	secondary storage.Store
}

// NewAttachmentService wires the attachment store. `primary` is the
// backend new uploads go to; `secondary` may be nil and is only consulted
// for reads (and swept on delete) when a deployment migrated between
// backends, so records written before the switch keep resolving without
// a migration tool.
func NewAttachmentService(db *sql.DB, primary, secondary storage.Store) *AttachmentService {
	return &AttachmentService{db: db, primary: primary, secondary: secondary}
}

type StoreAttachmentInput struct {
	ItemID      string
	Type        model.AttachmentType
	Filename    string
	ContentType string
	Reader      io.Reader
	IsAISource  bool
}

func (s *AttachmentService) Store(ctx context.Context, in StoreAttachmentInput) (*model.Attachment, error) {
	if in.ItemID == "" {
		return nil, errors.New("item_id required")
	}
	if in.Type == "" {
		return nil, errors.New("type required")
	}
	if in.Reader == nil {
		return nil, errors.New("file required")
	}
	if _, err := NewItemService(s.db).Get(ctx, in.ItemID); err != nil {
		return nil, err
	}

	now := time.Now().Unix()
	id := ulid.Make().String()
	filename := cleanFilename(in.Filename)
	relPath := filepath.Join("attachments", in.ItemID, id+"-"+filename)
	size, err := s.primary.Put(ctx, relPath, in.Reader, -1, in.ContentType)
	if err != nil {
		return nil, fmt.Errorf("store attachment object: %w", err)
	}

	isAI := 0
	if in.IsAISource {
		isAI = 1
	}
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO attachments (id, item_id, type, filename, path, size, content_type, is_ai_source, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, in.ItemID, in.Type, filename, filepath.ToSlash(relPath), size, in.ContentType, isAI, now,
	)
	if err != nil {
		_ = s.primary.Delete(ctx, relPath)
		return nil, fmt.Errorf("insert attachment: %w", err)
	}

	return s.Get(ctx, id)
}

func (s *AttachmentService) List(ctx context.Context, itemID string) ([]*model.Attachment, error) {
	if err := s.ensureItemVisible(ctx, itemID); err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, item_id, type, filename, path, size, content_type, is_ai_source, created_at
		FROM attachments WHERE item_id = ? ORDER BY created_at DESC, id DESC`, itemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []*model.Attachment{}
	for rows.Next() {
		att, err := scanAttachment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, att)
	}
	return out, rows.Err()
}

func (s *AttachmentService) Get(ctx context.Context, id string) (*model.Attachment, error) {
	row := s.db.QueryRowContext(ctx, `
		SELECT id, item_id, type, filename, path, size, content_type, is_ai_source, created_at
		FROM attachments WHERE id = ?`, id)

	att, err := scanAttachment(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return att, nil
}

func (s *AttachmentService) Open(ctx context.Context, id string) (*model.Attachment, io.ReadSeekCloser, error) {
	att, err := s.Get(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if err := s.ensureItemVisible(ctx, att.ItemID); err != nil {
		return nil, nil, err
	}
	file, err := s.openObject(ctx, att.Path)
	if err != nil {
		return nil, nil, err
	}
	return att, file, nil
}

// OpenByPath reads attachment content by its stored key without item
// visibility checks; it exists for the backup service, which streams
// every record regardless of caller permissions.
func (s *AttachmentService) OpenByPath(ctx context.Context, key string) (io.ReadSeekCloser, error) {
	return s.openObject(ctx, key)
}

// openObject resolves a stored key against the active store, falling back
// to the previous backend when the object is not there yet (local→S3
// migrations, or a backup restored onto disk while running in S3 mode).
func (s *AttachmentService) openObject(ctx context.Context, key string) (io.ReadSeekCloser, error) {
	file, err := s.primary.Open(ctx, key)
	if errors.Is(err, storage.ErrNotFound) && s.secondary != nil {
		return s.secondary.Open(ctx, key)
	}
	return file, err
}

// Delete drops the DB record and sweeps both stores: the object may live
// in either backend (or neither, if it was already cleaned up).
func (s *AttachmentService) Delete(ctx context.Context, id string) error {
	att, err := s.Get(ctx, id)
	if err != nil {
		return err
	}
	if err := s.ensureItemVisible(ctx, att.ItemID); err != nil {
		return err
	}
	if att.IsAISource {
		return ErrAISourceProtected
	}

	if err := s.deleteObject(ctx, att.Path); err != nil {
		return err
	}

	if _, err := s.db.ExecContext(ctx, `DELETE FROM attachments WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete attachment record: %w", err)
	}
	return nil
}

func (s *AttachmentService) deleteObject(ctx context.Context, key string) error {
	var firstErr error
	if err := s.primary.Delete(ctx, key); err != nil && firstErr == nil {
		firstErr = err
	}
	if s.secondary != nil {
		if err := s.secondary.Delete(ctx, key); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

type attachmentScanner interface {
	Scan(dest ...any) error
}

func scanAttachment(row attachmentScanner) (*model.Attachment, error) {
	var att model.Attachment
	var isAI int
	var contentType sql.NullString
	if err := row.Scan(
		&att.ID, &att.ItemID, &att.Type, &att.Filename, &att.Path, &att.Size,
		&contentType, &isAI, &att.CreatedAt,
	); err != nil {
		return nil, err
	}
	if contentType.Valid {
		att.ContentType = contentType.String
	}
	att.URL = "/api/v1/attachments/" + att.ID + "/content"
	att.IsAISource = isAI != 0
	return &att, nil
}

func (s *AttachmentService) ensureItemVisible(ctx context.Context, itemID string) error {
	visible, err := itemVisibleForCaller(ctx, s.db, itemID)
	if err != nil {
		return err
	}
	if !visible {
		return ErrNotFound
	}
	return nil
}

func cleanFilename(name string) string {
	name = filepath.Base(strings.TrimSpace(name))
	if name == "." || name == string(filepath.Separator) || name == "" {
		return "attachment"
	}
	return name
}
