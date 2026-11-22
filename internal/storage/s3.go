package storage

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// S3Config describes an S3-compatible endpoint (MinIO, OmniStore, R2,
// B2, ...). Endpoint is host[:port] without scheme; the transport is
// chosen by UseSSL.
type S3Config struct {
	Endpoint        string
	Region          string
	Bucket          string
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
	UsePathStyle    bool
}

// S3 stores attachment payloads on an S3-compatible bucket. Object keys
// equal the slash-relative paths stored in the database, keeping the
// attachment table backend-agnostic.
type S3 struct {
	client *minio.Client
	bucket string
}

type spooledFile struct {
	file   *os.File
	reader io.Reader
	size   int64
	close  func()
}

func NewS3(cfg S3Config) (*S3, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:        credentials.NewStaticV4(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		Secure:       cfg.UseSSL,
		Region:       cfg.Region,
		BucketLookup: bucketLookup(cfg),
	})
	if err != nil {
		return nil, fmt.Errorf("create s3 client: %w", err)
	}
	return &S3{client: client, bucket: cfg.Bucket}, nil
}

func bucketLookup(cfg S3Config) minio.BucketLookupType {
	if cfg.UsePathStyle {
		return minio.BucketLookupPath
	}
	return minio.BucketLookupAuto
}

// Probe verifies credentials and bucket existence at startup so a broken
// S3 configuration fails fast instead of on the first upload.
func (s *S3) Probe(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return fmt.Errorf("probe s3 bucket %q: %w", s.bucket, err)
	}
	if !exists {
		return fmt.Errorf("s3 bucket %q does not exist", s.bucket)
	}
	return nil
}

// Put uploads the payload. A known size within the single-PUT threshold
// goes out as one plain PUT; unknown sizes are first spooled to a temp
// file because minio-go streams unknown-length uploads as aws-chunked
// multipart, which minimal S3-compatible servers (e.g. OmniStore) reject.
// Attachment uploads are capped at a few dozen MB, so the spool is cheap.
func (s *S3) Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) (int64, error) {
	if size < 0 {
		spooled, err := spoolReader(r)
		if err != nil {
			return 0, fmt.Errorf("spool object %s: %w", key, err)
		}
		defer spooled.close()
		r, size = spooled.reader, spooled.size
	}
	info, err := s.client.PutObject(ctx, s.bucket, key, r, size, minio.PutObjectOptions{
		ContentType: contentType,
		// Send UNSIGNED-PAYLOAD instead of minio-go's default signed
		// streaming (STREAMING-AWS4-HMAC-SHA256-PAYLOAD), which minimal
		// S3-compatible servers commonly reject. Transport TLS and the
		// server-side auth cover integrity for attachment payloads.
		DisableContentSha256: true,
	})
	if err != nil {
		return 0, fmt.Errorf("put object %s: %w", key, err)
	}
	return info.Size, nil
}

func spoolReader(r io.Reader) (*spooledFile, error) {
	file, err := os.CreateTemp("", "havit-s3-put-*")
	if err != nil {
		return nil, err
	}
	// The file stays open for the upload; the deferred close removes it.
	written, copyErr := io.Copy(file, r)
	if copyErr != nil {
		_ = file.Close()
		_ = os.Remove(file.Name())
		return nil, copyErr
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		_ = file.Close()
		_ = os.Remove(file.Name())
		return nil, err
	}
	return &spooledFile{
		file:   file,
		reader: file,
		size:   written,
		close:  func() { _ = file.Close(); _ = os.Remove(file.Name()) },
	}, nil
}

func (s *S3) Open(ctx context.Context, key string) (io.ReadSeekCloser, error) {
	obj, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, mapS3Error(key, err)
	}
	// GetObject is lazy: the error only surfaces on first use, so force a
	// HEAD here to keep missing keys mapping to ErrNotFound.
	if _, err := obj.Stat(); err != nil {
		_ = obj.Close()
		return nil, mapS3Error(key, err)
	}
	return obj, nil
}

func (s *S3) Delete(ctx context.Context, key string) error {
	err := s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
	if err == nil {
		return nil
	}
	if isNoSuchObject(err) {
		return nil // idempotent delete, mirrors Local
	}
	return fmt.Errorf("remove object %s: %w", key, err)
}

func mapS3Error(key string, err error) error {
	if isNoSuchObject(err) {
		return fmt.Errorf("%w: %s", ErrNotFound, key)
	}
	return fmt.Errorf("s3 object %s: %w", key, err)
}

// Servers answer HEAD on a missing key with "NotFound" and GET with
// "NoSuchKey"; accept both spellings.
func isNoSuchObject(err error) bool {
	resp := minio.ToErrorResponse(err)
	return resp.Code == "NoSuchKey" || resp.Code == "NotFound"
}
