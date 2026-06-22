# Boards: default 26×50 grid + PDF count display

## 1. New boards start with 26 columns × 50 rows

Update the "create board" path so every newly created board is seeded with:
- 26 text columns named `A`, `B`, `C`, … `Z` (positions 0–25, type `text`)
- 50 empty rows (positions 0–49)

Column type can still be changed afterward via the existing column type menu — no change there.

**Where:**
- `src/hooks/useBoards.ts` (or wherever `addBoard` / board creation lives) — after the `boards` row is inserted, bulk-insert the 26 `board_columns` and 50 `board_rows` rows in two `supabase.from(...).insert([...])` calls.
- Existing boards are left untouched (per your choice).

## 2. PDF export — show how many columns/rows will be exported

**In the export dialog (live preview):**
- In the PDF settings dialog used for boards (the one opened from `BoardDetail`), add a small summary line:
  `26 columns × 50 rows will be exported`
- The count reflects the user's current filters/visibility toggles — if a column or row is hidden/excluded from the PDF, it isn't counted.

**On the PDF itself:**
- In `src/lib/boardPdfGenerator.ts`, add a small footer on every page:
  `X columns × Y rows` (right-aligned, same small footer style as page numbers).

## Technical notes

- Seeding uses two batch inserts; no per-row loop. `board_cells` are NOT pre-created — they're created lazily by `setCellValue` as today, so 26×50 empty cells cost nothing.
- The default column name pattern `A…Z` is purely cosmetic; users can rename immediately.
- PDF footer count is computed from the same arrays the generator already iterates, so no extra queries.

## Out of scope

- No migration / no schema changes.
- No backfill of existing boards.
- No change to column-type switching UI (already exists).
