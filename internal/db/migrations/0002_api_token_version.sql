-- +goose Up
-- Bind PATs to the user's token_version so that password changes and
-- revoke-all-sessions (which bump the version) also invalidate existing
-- personal access tokens, matching JWT session semantics.

ALTER TABLE api_tokens ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

-- +goose Down
ALTER TABLE api_tokens DROP COLUMN token_version;
