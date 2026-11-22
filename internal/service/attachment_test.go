package service

import (
	"bytes"
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/mahoo12138/havit/internal/model"
	"github.com/mahoo12138/havit/internal/storage"
)

func TestAttachmentServiceStoresPhotoAndMetadata(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	items := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")
	item, err := items.Create(ctx, ItemCreateInput{
		Name:       "相机",
		Type:       model.ItemTypeDurable,
		LocationID: &locID,
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	root := t.TempDir()
	svc := NewAttachmentService(database, storage.NewLocal(root), nil)

	photo, err := svc.Store(ctx, StoreAttachmentInput{
		ItemID:      item.ID,
		Type:        model.AttachmentTypePhoto,
		Filename:    "camera.jpg",
		ContentType: "image/jpeg",
		Reader:      bytes.NewReader([]byte("fake-jpeg")),
	})
	if err != nil {
		t.Fatalf("store photo: %v", err)
	}
	if photo.ID == "" {
		t.Fatal("expected attachment id")
	}
	if photo.URL == "" {
		t.Fatal("expected attachment url")
	}

	stored, err := os.ReadFile(filepath.Join(root, photo.Path))
	if err != nil {
		t.Fatalf("read stored file: %v", err)
	}
	if string(stored) != "fake-jpeg" {
		t.Fatalf("unexpected stored file content: %q", stored)
	}

	list, err := svc.List(ctx, item.ID)
	if err != nil {
		t.Fatalf("list attachments: %v", err)
	}
	if len(list) != 1 || list[0].ID != photo.ID {
		t.Fatalf("expected stored attachment in list, got %#v", list)
	}
}

func TestAttachmentPrivacyIsolatesPrivateItems(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	seedUser(t, database, "user-alice", "member")
	locID := createTestLocation(t, ctx, database, "书房")
	alice := "user-alice"
	item, err := NewItemService(database).Create(ctxAs(alice), ItemCreateInput{
		Name: "私密相机", Type: model.ItemTypeDurable, LocationID: &locID,
		IsPrivate: boolPtr(true), OwnerID: &alice,
	})
	if err != nil {
		t.Fatalf("create private item: %v", err)
	}
	svc := NewAttachmentService(database, storage.NewLocal(t.TempDir()), nil)
	photo, err := svc.Store(ctxAs(alice), StoreAttachmentInput{
		ItemID:      item.ID,
		Type:        model.AttachmentTypePhoto,
		Filename:    "private.jpg",
		ContentType: "image/jpeg",
		Reader:      bytes.NewReader([]byte("fake-jpeg")),
	})
	if err != nil {
		t.Fatalf("store photo: %v", err)
	}

	bob := ctxAs("user-bob")
	if _, err := svc.List(bob, item.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob list attachments: expected ErrNotFound, got %v", err)
	}
	if _, _, err := svc.Open(bob, photo.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob open attachment: expected ErrNotFound, got %v", err)
	}
	if err := svc.Delete(bob, photo.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("bob delete attachment: expected ErrNotFound, got %v", err)
	}
}

func TestAttachmentOpenFallsBackToSecondaryStore(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	items := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")
	item, err := items.Create(ctx, ItemCreateInput{Name: "相机", Type: model.ItemTypeDurable, LocationID: &locID})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	// Simulate a local→S3 migration: the record was written while the local
	// store was primary; the service now runs with the (empty) secondary as
	// primary and local as fallback.
	localRoot := t.TempDir()
	legacy := NewAttachmentService(database, storage.NewLocal(localRoot), nil)
	stored, err := legacy.Store(ctx, StoreAttachmentInput{
		ItemID:      item.ID,
		Type:        model.AttachmentTypePhoto,
		Filename:    "camera.jpg",
		ContentType: "image/jpeg",
		Reader:      strings.NewReader("fake-jpeg"),
	})
	if err != nil {
		t.Fatalf("store legacy photo: %v", err)
	}

	primary := newTrackingStore(t.TempDir())
	migrated := NewAttachmentService(database, primary, storage.NewLocal(localRoot))

	file, err := migrated.OpenByPath(ctx, stored.Path)
	if err != nil {
		t.Fatalf("open via fallback: %v", err)
	}
	data, err := io.ReadAll(file)
	_ = file.Close()
	if err != nil {
		t.Fatalf("read fallback content: %v", err)
	}
	if string(data) != "fake-jpeg" {
		t.Fatalf("unexpected fallback content: %q", data)
	}
	if primary.puts != 0 {
		t.Fatalf("fallback read must not write to the new store, got %d puts", primary.puts)
	}

	// New uploads always land on the primary store.
	fresh, err := migrated.Store(ctx, StoreAttachmentInput{
		ItemID:      item.ID,
		Type:        model.AttachmentTypePurchaseProof,
		Filename:    "invoice.pdf",
		ContentType: "application/pdf",
		Reader:      strings.NewReader("fake-pdf"),
	})
	if err != nil {
		t.Fatalf("store migrated photo: %v", err)
	}
	if primary.puts != 1 {
		t.Fatalf("expected new upload on primary store, got %d puts", primary.puts)
	}
	if _, err := os.Stat(filepath.Join(primary.rootDir, fresh.Path)); err != nil {
		t.Fatalf("new upload missing from primary store: %v", err)
	}
}

func TestAttachmentDeleteSweepsBothStores(t *testing.T) {
	ctx := context.Background()
	database := newTestDB(t)
	items := NewItemService(database)
	locID := createTestLocation(t, ctx, database, "书房")
	item, err := items.Create(ctx, ItemCreateInput{Name: "相机", Type: model.ItemTypeDurable, LocationID: &locID})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}

	localRoot := t.TempDir()
	legacy := NewAttachmentService(database, storage.NewLocal(localRoot), nil)
	stored, err := legacy.Store(ctx, StoreAttachmentInput{
		ItemID:      item.ID,
		Type:        model.AttachmentTypePhoto,
		Filename:    "camera.jpg",
		ContentType: "image/jpeg",
		Reader:      strings.NewReader("fake-jpeg"),
	})
	if err != nil {
		t.Fatalf("store legacy photo: %v", err)
	}

	primary := newTrackingStore(t.TempDir())
	migrated := NewAttachmentService(database, primary, storage.NewLocal(localRoot))
	if err := migrated.Delete(ctx, stored.ID); err != nil {
		t.Fatalf("delete across stores: %v", err)
	}
	if _, err := os.Stat(filepath.Join(localRoot, stored.Path)); !os.IsNotExist(err) {
		t.Fatalf("expected object removed from fallback store, got err=%v", err)
	}
	if _, err := os.Stat(filepath.Join(primary.rootDir, stored.Path)); !os.IsNotExist(err) {
		t.Fatalf("expected object removed from primary store, got err=%v", err)
	}
	if _, err := migrated.Get(ctx, stored.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected DB record removed, got %v", err)
	}
}

// trackingStore counts Put calls and remembers the root dir it writes to.
type trackingStore struct {
	storage.Store
	puts    int
	rootDir string
}

func newTrackingStore(root string) *trackingStore {
	return &trackingStore{Store: storage.NewLocal(root), rootDir: root}
}

func (s *trackingStore) Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) (int64, error) {
	s.puts++
	return s.Store.Put(ctx, key, r, size, contentType)
}
