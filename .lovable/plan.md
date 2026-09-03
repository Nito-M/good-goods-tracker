# Activity Log (Audit Trail)

A single place that records who created, edited, or deleted records — so a disappearing part like A1-046 can be traced to a person and a time.

## Where it lives

Knowledge Base gets a second tab/card at the top: **Procedures** (today's content) and **Activity Log**. New route `/knowledge-base/activity`, reachable from the Knowledge Base header. This keeps it out of the daily workflow pages but easy to find, and it inherits Knowledge Base page permissions.

## What gets recorded

Recording happens in the database itself, not in the app screens — so it captures every delete/create no matter where it came from (any page, CSV import, bulk actions).

Tracked records (created, edited, deleted):

- Items / inventory, item vendor prices, stock locations
- Vendors, customers, workers
- Purchase orders + PO items, requests
- Quotes / sales orders + their items, invoices (sales) + items
- Jobs + job items
- Assemblies + assembly items, sub assemblies + their items, parts
- Knowledge Base: SOPs, steps, BOM items
- Bank cards and transactions

Each entry stores: what happened (Created / Updated / Deleted), which record type, the record's name or number, who did it, when, and a snapshot of the row (before/after) so a deleted record can be read back — and restored by hand if needed.

Edits only log when a meaningful field actually changed, so routine background saves don't flood the list.

## The Activity Log screen

- Newest first, grouped by day, infinite scroll / paged.
- Filters: action (Created / Updated / Deleted), record type, user, date range, and free-text search on the record name/number.
- Each row: time, user name, colored action badge, record type + name, and an expander showing the changed fields (before → after) or the full deleted snapshot.
- Deletes are visually highlighted since they're the main thing being hunted.
- Rows link to the live record when it still exists.

## Access

Admins and organization owners/admins only — the log exposes other members' activity. Regular members won't see the tab.

## Notes and limits

- This starts recording from the moment it's turned on; past deletions (including the A1-046 one) can't be reconstructed retroactively.
- Entries are read-only — nobody can edit or delete log rows from the app.
- Old entries are kept indefinitely for now; if the log ever gets heavy we can add an automatic 12-month trim later.

## Technical summary

- New table `public.activity_logs`: `organization_id`, `user_id`, `table_name`, `record_id`, `record_label`, `action` (insert/update/delete), `changed_fields jsonb`, `old_data jsonb`, `new_data jsonb`, `created_at`. Indexed on `(organization_id, created_at desc)`, `record_id`, and `action`.
- Generic `SECURITY DEFINER` trigger function `public.log_activity()` attached AFTER INSERT/UPDATE/DELETE on each tracked table. It resolves the actor via `auth.uid()`, derives `organization_id` from the row (or from `organization_members` via `user_id` when the table has no org column), picks a label from the first available of `name`, `po_number`, `invoice_number`, `quote_number`, `job_number`, `request_number`, `title`, `sku`, and skips no-op updates.
- `inventory_items` uses a soft delete (`deleted_at`), so the trigger classifies an update that sets `deleted_at` as a Delete action.
- RLS: read-only for org admins/owners and super admins (`is_org_admin_or_owner`, `has_role`); no insert/update/delete policies for app roles — only the definer trigger writes. GRANT `SELECT` to `authenticated`, `ALL` to `service_role`.
- Frontend: `src/hooks/useActivityLogs.ts` (paged React Query fetch with filters, joined display names from `profiles`), `src/pages/ActivityLog.tsx`, route in `src/App.tsx`, entry point button in the Knowledge Base header.
