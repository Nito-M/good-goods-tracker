

## Boards — Monday.com-style spreadsheet page

A new "Boards" module: create multiple sheets, define your own columns (rename anytime), add rows, edit cells inline, and group rows under collapsible headers by any column.

### What you'll get

**Sidebar entry**: New "Boards" item in the left sidebar (after Notes), with collapsible sub-items listing each board you've created. Click a board name to open it.

**Boards landing page** (`/boards`)
- Grid of board cards (name, row count, last updated)
- "+ New Board" button — creates a fresh board with 3 default columns ("Item", "Status", "Notes") that you can immediately rename

**Board detail page** (`/boards/:id`)
- Editable board title at the top
- Spreadsheet table with:
  - **First column** = row label ("Item"), always pinned
  - **Custom columns** — click the header to rename inline; drag to reorder; "+" button at the end of the header row to add a new column; right-click (or "⋮" menu) on a header to delete it
  - **Cells** — click to edit text inline (auto-save on blur / Enter). Plain text only, no colors per your choice
  - **Rows** — "+ Add row" button at the bottom of each group; right-click row to delete
- **Group by** dropdown in the toolbar — pick any column; rows collapse under headers like "▼ 2026" with a row count badge. Pick "(none)" for a flat list
- Empty state when no rows yet

**Permissions**: Standard org-scoped RLS — all org members can view/edit boards in their org. Page-permission key `boards` so admins can hide it per user via existing user permissions.

### Technical details

**Database** (one migration)
- `boards` — `id`, `organization_id`, `user_id`, `name`, `group_by_column_id` (nullable), `created_at`, `updated_at`
- `board_columns` — `id`, `board_id`, `name`, `position` (int), `created_at`
- `board_rows` — `id`, `board_id`, `position` (int), `created_at`, `updated_at`
- `board_cells` — `id`, `row_id`, `column_id`, `value` (text), `updated_at`; unique `(row_id, column_id)`
- RLS on all four: SELECT/INSERT/UPDATE/DELETE allowed when `users_share_org(auth.uid(), boards.user_id)` (via join to `boards`)
- `update_updated_at_column` triggers on `boards`, `board_rows`, `board_cells`

**Files to create**
- `src/hooks/useBoards.ts` — list/create/rename/delete boards
- `src/hooks/useBoard.ts` — single board with columns, rows, cells; mutations for column add/rename/delete/reorder, row add/delete/reorder, cell upsert
- `src/pages/Boards.tsx` — landing grid
- `src/pages/BoardDetail.tsx` — spreadsheet view with grouping, inline editing, column management

**Files to edit**
- `src/App.tsx` — register `/boards` and `/boards/:id` routes inside `AppLayout` + `ProtectedRoute`
- `src/components/AppSidebar.tsx` — add "Boards" menu item with `pageKey: "boards"`; collapsible sub-list of boards (similar to existing Jobs sub-links pattern)
- `src/hooks/usePagePermissions.ts` — add `boards: ['/boards']` to `PAGE_KEY_TO_ROUTES`
- `src/components/UsersSettings.tsx` (page-permissions UI) — add "Boards" toggle so admins can restrict access

**UX details**
- Column rename uses the same inline-edit pattern as `PartsLanding.tsx` (Pencil → Input + Check/X)
- Row grouping built client-side: group cells by `group_by_column_id`'s value, render collapsible `<Collapsible>` sections; rows with empty group value go under "(Ungrouped)"
- Cell saves are debounced/on-blur upserts to `board_cells` keyed on `(row_id, column_id)`
- Horizontal scroll on the table container so wide boards (many columns) work like the screenshot

### Out of scope (can add later if you want)

- Cell colors / status dropdowns (you chose plain text)
- Column types beyond text (date, number, person, dropdown)
- Drag-and-drop row reordering across groups
- CSV import/export
- Sharing boards across orgs

