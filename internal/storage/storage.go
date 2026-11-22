// Package storage abstracts attachment object storage behind a minimal
// Put/Open/Delete surface so attachments can live on the local data
// directory or any S3-compatible object store.
package storage

import (
	"context"
	"errors"
	"io"
)

// ErrNotFound reports that the key exists in no store. The attachment
// service maps missing objects to it and uses it to drive the read
// fallback between the active and the legacy store.
var ErrNotFound = errors.New("object not found")

// Store is the persistence surface for attachment payloads. Keys are
// slash-separated paths relative to the store root; the same key must
// resolve identically across Store implementations so records can be
// migrated between backends without touching the database.
//
// Put returns the number of bytes persisted (callers pass size < 0 when
// the length is unknown and get it measured by the store). Open must
// return a ReadSeekCloser: responses are served with http.ServeContent,
// which needs range/seek support (PDF inline viewers and video scrubbing
// rely on it).
type Store interface {
	Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) (int64, error)
	Open(ctx context.Context, key string) (io.ReadSeekCloser, error)
	Delete(ctx context.Context, key string) error
}
