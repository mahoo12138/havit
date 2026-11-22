package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// Local keeps objects as regular files under a root directory. Keys are
// slash-separated relative paths and map 1:1 onto the historical
// dataDir/attachments layout, so backups restored from a tarball keep
// working without any transformation.
type Local struct {
	root string
}

func NewLocal(root string) *Local {
	return &Local{root: root}
}

func (s *Local) Put(_ context.Context, key string, r io.Reader, _ int64, _ string) (int64, error) {
	abs := filepath.Join(s.root, filepath.FromSlash(key))
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return 0, fmt.Errorf("create object dir: %w", err)
	}
	// O_EXCL mirrors the previous attachment writer: keys embed a ULID, so
	// an existing file would indicate a duplicate ID, not an overwrite.
	file, err := os.OpenFile(abs, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return 0, fmt.Errorf("create object file: %w", err)
	}
	written, copyErr := io.Copy(file, r)
	closeErr := file.Close()
	if copyErr != nil {
		_ = os.Remove(abs)
		return written, fmt.Errorf("write object file: %w", copyErr)
	}
	if closeErr != nil {
		_ = os.Remove(abs)
		return written, fmt.Errorf("close object file: %w", closeErr)
	}
	return written, nil
}

func (s *Local) Open(_ context.Context, key string) (io.ReadSeekCloser, error) {
	file, err := os.Open(filepath.Join(s.root, filepath.FromSlash(key)))
	if os.IsNotExist(err) {
		return nil, fmt.Errorf("%w: %s", ErrNotFound, key)
	}
	if err != nil {
		return nil, fmt.Errorf("open object file: %w", err)
	}
	return file, nil
}

// Delete removes the object; a missing file counts as success so callers
// can sweep both stores without pre-checking where an object lives.
func (s *Local) Delete(_ context.Context, key string) error {
	if err := os.Remove(filepath.Join(s.root, filepath.FromSlash(key))); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove object file: %w", err)
	}
	return nil
}
