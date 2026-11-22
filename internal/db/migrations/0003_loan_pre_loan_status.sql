-- +goose Up
-- Remember the item status a loan started from, so returning an item that
-- was idle or for_sale restores that status instead of forcing in_stock.

ALTER TABLE loans ADD COLUMN pre_loan_status TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE loans DROP COLUMN pre_loan_status;
