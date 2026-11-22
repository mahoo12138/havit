package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/mahoo12138/havit/internal/service"
)

type NotifyHandler struct {
	svc *service.NotifyService
}

func NewNotifyHandler(svc *service.NotifyService) *NotifyHandler {
	return &NotifyHandler{svc: svc}
}

func (h *NotifyHandler) Mount(r chi.Router) {
	r.Post("/notify/process-due", h.processDue)
}

func (h *NotifyHandler) processDue(w http.ResponseWriter, r *http.Request) {
	// Delivery consumes every user's pending reminders, so the trigger time is
	// always the server clock — a caller-supplied timestamp could force-deliver
	// and permanently mark the whole backlog as sent.
	result, err := h.svc.ProcessDue(r.Context(), time.Now().Unix())
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
