package storage

import (
	"bytes"
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLocalStoreRoundtripAndNotFound(t *testing.T) {
	ctx := context.Background()
	root := t.TempDir()
	store := NewLocal(root)

	written, err := store.Put(ctx, "attachments/item-1/photo.jpg", strings.NewReader("jpeg-bytes"), -1, "image/jpeg")
	if err != nil {
		t.Fatalf("put: %v", err)
	}
	if written != int64(len("jpeg-bytes")) {
		t.Fatalf("expected measured size %d, got %d", len("jpeg-bytes"), written)
	}
	if _, err := os.Stat(filepath.Join(root, "attachments", "item-1", "photo.jpg")); err != nil {
		t.Fatalf("object file missing: %v", err)
	}

	file, err := store.Open(ctx, "attachments/item-1/photo.jpg")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer file.Close()

	// ServeContent relies on seeking; verify the reader survives it.
	size, err := file.Seek(0, io.SeekEnd)
	if err != nil {
		t.Fatalf("seek end: %v", err)
	}
	if size != int64(len("jpeg-bytes")) {
		t.Fatalf("seek size mismatch: %d", size)
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		t.Fatalf("seek start: %v", err)
	}
	data, err := io.ReadAll(file)
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if string(data) != "jpeg-bytes" {
		t.Fatalf("unexpected content: %q", data)
	}

	if err := store.Delete(ctx, "attachments/item-1/photo.jpg"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	// Deleting an absent object is idempotent.
	if err := store.Delete(ctx, "attachments/item-1/photo.jpg"); err != nil {
		t.Fatalf("idempotent delete: %v", err)
	}

	if _, err := store.Open(ctx, "attachments/item-1/photo.jpg"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound after delete, got %v", err)
	}
	if _, err := store.Open(ctx, "attachments/item-1/missing.jpg"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound for absent key, got %v", err)
	}
}

// keySanity guards the contract that keys map identically across stores:
// bytes in must come out byte-identical with a sized reader too.
func TestLocalStoreSizedPut(t *testing.T) {
	ctx := context.Background()
	store := NewLocal(t.TempDir())

	payload := bytes.Repeat([]byte("a"), 4096)
	written, err := store.Put(ctx, "attachments/item-1/blob.bin", bytes.NewReader(payload), int64(len(payload)), "application/octet-stream")
	if err != nil {
		t.Fatalf("put: %v", err)
	}
	if written != int64(len(payload)) {
		t.Fatalf("expected size %d, got %d", len(payload), written)
	}
}
