

## Plan: Improve Quote PDF Layout and Alignment

### Problems Identified (from the PDF)
1. Excessive vertical gaps between header, title, details, bill-to, and table sections
2. Table column positions are not well-distributed -- Item column too narrow, SKU cramped
3. Redundant double separator line after the last item (one from the item loop + one after the loop)
4. Too much spacing after the items table before totals/notes, pushing content to page 2 unnecessarily
5. The separator lines between items need consistent full-width rendering

### Changes

#### File: `src/lib/quoteGenerator.ts`

1. **Reduce vertical spacing between sections**:
   - Reduce gap after logo from `+5` to `+2`
   - Reduce gap after business info from `+5` to `+2`
   - Reduce title bottom margin from `+15` to `+10`
   - Reduce gap after quote details from `+3` to `+2`
   - Reduce gap after bill-to from `+10` to `+5`

2. **Better table column distribution** (full page width = 210mm, margins 20mm each side = 170mm usable):
   - Item: `tableX + 2` (keep) -- allocate ~70mm width for item names
   - SKU: `tableX + 72` (was 60) -- shift right, allocate ~30mm
   - Qty: `tableX + 105` (was 95) -- shift right  
   - Price: `tableX + 130` (was 115) -- shift right (when visible)
   - Total: `pageWidth - 22` right-aligned (keep)
   - Update `splitTextToSize` width for item names from 55 to 67, SKU from 32 to 30

3. **Remove duplicate separator line** after the items loop (lines 236-244) -- the per-item separator is sufficient. Just add small spacing before totals.

4. **Reduce post-table spacing**: Change `y += 5` + separator + `y += 10` to just `y += 6`

5. **Apply same column positions** in `addPageWithHeader` function for consistency

#### File: `src/components/QuotePreviewDialog.tsx`

6. **Tighten preview spacing** to match the PDF improvements:
   - Reduce margins between header, title, details, bill-to sections (`mb-8` → `mb-4`, `my-6` → `my-3`, `mb-6` → `mb-4`)
   - Adjust table column widths for better distribution

