

## Column types: text, date, checkbox, status, files

### What you'll get

**Add column**: clicking "+" in the header row opens a small popover with type choices:
- **Text** (current default)
- **Date** — opens a date picker; cell shows formatted date
- **Checkbox** — toggleable boolean
- **Status** — dropdown of predefined options with colored badges; you define the options/colors per column
- **Files** — multiple PDFs per cell, click to upload, list with download/delete

**Column menu** (⋮ on header) gains:
- Rename
- **Change type** — sub-menu lets you convert; existing values are kept as text fallback when conversion doesn't match (e.g. "yes" → checkbox unchecked, invalid date → empty)
- **Manage status options** (only on Status columns) — opens a dialog to add/rename/recolor/delete options
- Delete column

**Cell rendering by type**:
- Text → inline input (existing behavior)
- Date → button showing date or "—", click opens calendar popover
- Checkbox → centered checkbox
- Status → colored badge button, click opens dropdown of options (or "Clear")
- Files → row of file chips with name + download + ✕; "+" button to upload PDFs

### Database changes (one migration)

- `board_columns` add columns:
  - `type TEXT NOT NULL DEFAULT 'text'` (allowed: text, date, checkbox, status, files)
  - `options JSONB NOT NULL DEFAULT '[]'` — for status: `[{ id, label, color }]`
- New table `board_cell_files`:
  - `id, cell_row_id, cell_column_id, file_url, file_name, file_size, created_at, user_id`
  - Unique not needed; ordered by created_at
  - RLS: same org-share check via parent board
- New storage bucket `board-files` (private), with org-share RLS policies (view/insert/update/delete by org members of the uploader)

### Cell value encoding (single `value TEXT` column, no schema migration to cells)

Keep existing `board_cells.value TEXT`; just interpret per column type:
- text → raw string
- date → ISO date string `YYYY-MM-DD` or empty
- checkbox → `"true"` or `""` 
- status → option `id` (UUID) referencing `board_columns.options[]`, or empty
- files → not stored in `board_cells`; lives in `board_cell_files` table keyed on (row_id, column_id)

This avoids touching cell schema and keeps grouping logic working (group by status uses the option's label looked up from the column's `options`).

### Files to create
- `src/hooks/useBoardCellFiles.ts` — list/upload/delete files for a (row, column) pair across the whole board (single fetch keyed by board_id)
- `src/components/board/AddColumnPopover.tsx` — type picker on "+"
- `src/components/board/StatusOptionsDialog.tsx` — manage status options (add, rename, color picker, delete)
- `src/components/board/cells/TextCell.tsx`, `DateCell.tsx`, `CheckboxCell.tsx`, `StatusCell.tsx`, `FilesCell.tsx`

### Files to edit
- `src/hooks/useBoard.ts` — extend `BoardColumn` with `type` + `options`; add `setColumnType`, `setColumnOptions`; expose `getCellFiles`, `uploadCellFile`, `deleteCellFile` (delegates to new hook)
- `src/pages/BoardDetail.tsx` — replace inline `<CellInput>` with `<CellRenderer>` that picks the right cell component by `column.type`; update `ColumnHeader` menu with "Change type" + "Manage status options"; render `+` column button as `AddColumnPopover`; update grouping to resolve status `id` → label
- Migration adds `type` + `options` to `board_columns`, creates `board_cell_files` table + RLS, creates `board-files` storage bucket + RLS

### UX details
- Status colors use a fixed palette of 10 HSL tokens (defined in cell component) so they respect light/dark themes
- File upload limited to PDF (`.pdf`, `application/pdf`) per your earlier choice; max 20MB matches platform default
- Files cell expands row height naturally; chips wrap
- Date cell uses `date-fns` and the existing `Calendar` component with `pointer-events-auto`
- Group-by on a status column shows the option label (or "(Ungrouped)" when empty)
- Group-by on a checkbox column shows "Checked" / "Unchecked"
- Group-by on a date column shows the raw date string (good enough for v1)
- Group-by on a files column is hidden from the dropdown (doesn't make sense)

### Out of scope (can add later)
- Drag-to-reorder status options
- Number / person / dropdown (non-status) column types
- Image previews inside file cells (PDFs only for now)
- Bulk converting cell values when changing type (kept as text fallback)

