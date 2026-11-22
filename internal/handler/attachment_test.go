package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"strings"
	"testing"
)

func TestPhotoUploadListAndReadHTTPFlow(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	if createLoc.Code != http.StatusCreated {
		t.Fatalf("expected location create 201, got %d: %s", createLoc.Code, createLoc.Body.String())
	}
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)

	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "相机",
		"type":        "durable",
		"location_id": loc.ID,
	})
	if createItem.Code != http.StatusCreated {
		t.Fatalf("expected item create 201, got %d: %s", createItem.Code, createItem.Body.String())
	}
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, mime.QEncoding.Encode("utf-8", "camera.jpg")))
	header.Set("Content-Type", "image/jpeg")
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if _, err := part.Write([]byte("fake-jpeg")); err != nil {
		t.Fatalf("write form file: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := authedRequest(http.MethodPost, "/api/v1/items/"+item.ID+"/photos", token, strings.NewReader(body.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected photo upload 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var uploaded struct {
		ID          string `json:"id"`
		URL         string `json:"url"`
		ContentType string `json:"content_type"`
	}
	decodeJSON(t, rec, &uploaded)
	if uploaded.ID == "" || uploaded.URL == "" || uploaded.ContentType != "image/jpeg" {
		t.Fatalf("unexpected upload response: %#v", uploaded)
	}

	list := httptest.NewRecorder()
	router.ServeHTTP(list, authedRequest(http.MethodGet, "/api/v1/items/"+item.ID+"/attachments", token, nil))
	if list.Code != http.StatusOK {
		t.Fatalf("expected attachment list 200, got %d: %s", list.Code, list.Body.String())
	}
	var listed struct {
		Attachments []struct {
			ID string `json:"id"`
		} `json:"attachments"`
	}
	if err := json.Unmarshal(list.Body.Bytes(), &listed); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(listed.Attachments) != 1 || listed.Attachments[0].ID != uploaded.ID {
		t.Fatalf("expected uploaded attachment in list, got %s", list.Body.String())
	}

	read := httptest.NewRecorder()
	router.ServeHTTP(read, authedRequest(http.MethodGet, uploaded.URL, token, nil))
	if read.Code != http.StatusOK {
		t.Fatalf("expected attachment read 200, got %d: %s", read.Code, read.Body.String())
	}
	if read.Body.String() != "fake-jpeg" {
		t.Fatalf("unexpected attachment content: %q", read.Body.String())
	}
	if got := read.Header().Get("Content-Type"); got != "image/jpeg" {
		t.Fatalf("expected image/jpeg content-type, got %q", got)
	}
}

func TestPhotoUploadRejectsSVG(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{"name": "书房"})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)
	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name": "相机", "type": "durable", "location_id": loc.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", `form-data; name="file"; filename="evil.svg"`)
	header.Set("Content-Type", "image/svg+xml")
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create part: %v", err)
	}
	if _, err := part.Write([]byte(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`)); err != nil {
		t.Fatalf("write part: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := authedRequest(http.MethodPost, "/api/v1/items/"+item.ID+"/photos", token, strings.NewReader(body.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected SVG upload rejected, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestPhotoUploadRejectsNonImageFile(t *testing.T) {
	router := newAuthTestRouter(t)
	token := setupToken(t, router)

	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{
		"name": "书房",
	})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)
	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name":        "相机",
		"type":        "durable",
		"location_id": loc.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", `form-data; name="file"; filename="note.txt"`)
	header.Set("Content-Type", "text/plain")
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create part: %v", err)
	}
	if _, err := part.Write([]byte("not an image")); err != nil {
		t.Fatalf("write part: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}

	req := authedRequest(http.MethodPost, "/api/v1/items/"+item.ID+"/photos", token, strings.NewReader(body.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected non-image upload 400, got %d: %s", rec.Code, rec.Body.String())
	}
}

// multipartUpload posts a single-file form to the generic attachment
// endpoint. typeField may be empty to exercise the dedicated photo alias.
func postMultipartFile(t *testing.T, router http.Handler, token, path, typeField, filename, contentType, content string) *httptest.ResponseRecorder {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, mime.QEncoding.Encode("utf-8", filename)))
	header.Set("Content-Type", contentType)
	part, err := writer.CreatePart(header)
	if err != nil {
		t.Fatalf("create part: %v", err)
	}
	if _, err := part.Write([]byte(content)); err != nil {
		t.Fatalf("write part: %v", err)
	}
	if typeField != "" {
		if err := writer.WriteField("type", typeField); err != nil {
			t.Fatalf("write type field: %v", err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}
	req := authedRequest(http.MethodPost, path, token, strings.NewReader(body.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	return rec
}

func seedAttachmentTarget(t *testing.T) (http.Handler, string, string) {
	t.Helper()
	router := newAuthTestRouter(t)
	token := setupToken(t, router)
	createLoc := postAuthedJSON(t, router, "/api/v1/locations/", token, map[string]string{"name": "书房"})
	var loc struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createLoc, &loc)
	createItem := postAuthedJSON(t, router, "/api/v1/items/", token, map[string]any{
		"name": "相机", "type": "durable", "location_id": loc.ID,
	})
	var item struct {
		ID string `json:"id"`
	}
	decodeJSON(t, createItem, &item)
	return router, token, item.ID
}

func TestPurchaseProofUploadAcceptsPDFAndDownloadsInline(t *testing.T) {
	router, token, itemID := seedAttachmentTarget(t)

	upload := postMultipartFile(t, router, token, "/api/v1/items/"+itemID+"/attachments", "purchase_proof",
		"invoice.pdf", "application/pdf", "fake-pdf")
	if upload.Code != http.StatusCreated {
		t.Fatalf("expected proof upload 201, got %d: %s", upload.Code, upload.Body.String())
	}
	var uploaded struct {
		ID          string `json:"id"`
		Type        string `json:"type"`
		Size        int64  `json:"size"`
		ContentType string `json:"content_type"`
	}
	decodeJSON(t, upload, &uploaded)
	if uploaded.Type != "purchase_proof" || uploaded.ContentType != "application/pdf" || uploaded.Size != int64(len("fake-pdf")) {
		t.Fatalf("unexpected upload response: %#v", uploaded)
	}

	read := httptest.NewRecorder()
	router.ServeHTTP(read, authedRequest(http.MethodGet, "/api/v1/attachments/"+uploaded.ID+"/content", token, nil))
	if read.Code != http.StatusOK || read.Body.String() != "fake-pdf" {
		t.Fatalf("expected proof content, got %d: %s", read.Code, read.Body.String())
	}
	disposition := read.Header().Get("Content-Disposition")
	if !strings.HasPrefix(disposition, "attachment") {
		t.Fatalf("expected PDF to download as attachment, got %q", disposition)
	}

	// Images of the same type still render inline.
	img := postMultipartFile(t, router, token, "/api/v1/items/"+itemID+"/attachments", "purchase_proof",
		"receipt.jpg", "image/jpeg", "fake-jpeg")
	if img.Code != http.StatusCreated {
		t.Fatalf("expected image proof upload 201, got %d: %s", img.Code, img.Body.String())
	}
	var imgAtt struct {
		ID string `json:"id"`
	}
	decodeJSON(t, img, &imgAtt)
	imgRead := httptest.NewRecorder()
	router.ServeHTTP(imgRead, authedRequest(http.MethodGet, "/api/v1/attachments/"+imgAtt.ID+"/content", token, nil))
	if got := imgRead.Header().Get("Content-Disposition"); !strings.HasPrefix(got, "inline") {
		t.Fatalf("expected image to serve inline, got %q", got)
	}
}

func TestAttachmentUploadRejectsBadTypeAndDisallowedFormats(t *testing.T) {
	router, token, itemID := seedAttachmentTarget(t)

	if rec := postMultipartFile(t, router, token, "/api/v1/items/"+itemID+"/attachments", "invoice",
		"evil.pdf", "application/pdf", "x"); rec.Code != http.StatusBadRequest {
		t.Fatalf("expected unknown type rejected, got %d: %s", rec.Code, rec.Body.String())
	}
	if rec := postMultipartFile(t, router, token, "/api/v1/items/"+itemID+"/attachments", "purchase_proof",
		"evil.svg", "image/svg+xml", "<svg/>"); rec.Code != http.StatusBadRequest {
		t.Fatalf("expected SVG proof rejected, got %d: %s", rec.Code, rec.Body.String())
	}
	if rec := postMultipartFile(t, router, token, "/api/v1/items/"+itemID+"/attachments", "photo",
		"note.txt", "text/plain", "x"); rec.Code != http.StatusBadRequest {
		t.Fatalf("expected text photo rejected, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestGenericAttachmentEndpointAcceptsPhotoType(t *testing.T) {
	router, token, itemID := seedAttachmentTarget(t)

	upload := postMultipartFile(t, router, token, "/api/v1/items/"+itemID+"/attachments", "photo",
		"camera.jpg", "image/jpeg", "fake-jpeg")
	if upload.Code != http.StatusCreated {
		t.Fatalf("expected photo upload 201, got %d: %s", upload.Code, upload.Body.String())
	}
	var uploaded struct {
		Type string `json:"type"`
	}
	decodeJSON(t, upload, &uploaded)
	if uploaded.Type != "photo" {
		t.Fatalf("expected photo type, got %q", uploaded.Type)
	}
}
