## Add a Price column type to Boards

Add a new `price` column type to boards alongside the existing Text/Date/Checkbox/Status/Files/Link/Connect types. It stores a numeric value and renders it as currency (e.g. `$1,234.56`).

### Changes

1. **`src/components/board/AddColumnPopover.tsx`**
   - Add `'price'` to the `BoardColumnType` union and to the `TYPES` list (DollarSign icon, label "Price", default name "Price").

2. **New cell component `src/components/board/cells/PriceCell.tsx`**
   - Edit mode: numeric input (step 0.01).
   - Display mode: `formatCurrency(value)` from `@/lib/utils`, right-aligned by default, tabular-nums.
   - Empty value renders as blank (not `$0.00`).
   - Supports formulas (`=A1+B2`, `SUM`, `AVG`) the same way TextCell does, formatted as currency when the result is numeric.
   - Honors `cellAlign` / `onChangeCellAlign` like TextCell.

3. **`src/pages/BoardDetail.tsx`**
   - Add a `case 'price':` in the cell renderer switch returning `<PriceCell …>`.
   - No DB schema change — `type` is a free-form text column, existing `update column type` flow already supports new values.

4. **`src/lib/boardPdfGenerator.ts`**
   - In `renderCell`, handle `col.type === 'price'`: evaluate formulas if present, then format with `formatCurrency`. Default halign right for price columns in `didParseCell`.

5. **Status column quick-change menu** (`BoardDetail.tsx` ~line 157)
   - Already maps over the same `TYPES` array from `AddColumnPopover`, so Price will automatically appear in the "change column type" dropdown.

### Out of scope
- No new DB migration (column `type` is text).
- No currency-symbol customization — uses the project's existing `formatCurrency` helper for consistency with the rest of the app.
- No changes to grouping/sorting beyond what text-type columns already do.
