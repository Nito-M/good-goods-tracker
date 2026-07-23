## Problem

When a quote that has been converted to a sales order is edited, all `quote_items` rows are deleted and recreated with new UUIDs. Sales-order features key off `quote_item_id`:

- `so_item_attachments` (add-on parent/child links) → orphaned/lost, so add-ons detach.
- `so_item_job_links` (created jobs, statuses, external job numbers) → orphaned/lost, so job links disappear from the sales order.
- `so_item_nvis_files` and `so_item_attachments` (per-unit NVIS PDFs) — same problem.

## Fix

Change `updateQuote` in `src/hooks/useQuotes.ts` from delete-all + insert-all to a diff-based upsert so existing item rows keep their IDs:

1. Fetch the current `quote_items` for the quote (ids only).
2. Split incoming `input.items` into:
   - **Existing** — id is a real UUID present in the current list → `UPDATE` that row with the new field values and new `sort_order`.
   - **New** — id starts with `new-` (matches the temp id pattern used in `EditQuoteDialog`) or isn't in the current list → `INSERT` with a fresh row.
3. Any current row whose id is not in the incoming list → `DELETE` (only truly removed items; their attachments/job links legitimately go away).
4. Recompute totals exactly as today and update the parent `quotes` row unchanged.

Because add-ons and job links reference `quote_item_id`, keeping the IDs stable preserves them across edits. No schema change and no touch to `SalesOrderDetail` / `SalesOrderItemDetail` needed.

## Scope

- `src/hooks/useQuotes.ts` — rewrite the item persistence block inside `updateQuote`. Everything else (create flow, sales-order UI, jobs, attachments) is unchanged.

## Notes

- `EditQuoteDialog` already passes each item's original id through unchanged for existing rows and uses `new-<timestamp>` for added rows, so no dialog changes are needed.
- Removing an item in the editor will still (correctly) drop its add-on/job link, matching current expectations for intentional deletions.