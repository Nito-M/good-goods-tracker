
## Make PDF Match the Quote Preview

### What's Different Today

Comparing `QuotePreviewDialog.tsx` (what you see) vs `quoteGenerator.ts` (what gets downloaded), there are several mismatches:

**1. Item name truncation**
- Preview: shows the full item name (no truncation)
- PDF: cuts off at 25 characters and appends `...`

**2. Quote Details layout order**
- Preview: Quote #, Date, Valid Until on the LEFT; Terms, Status on the RIGHT
- PDF: Quote #, Date on LEFT; Valid Until on LEFT; Terms on RIGHT; Status back on LEFT — the status ends up on the wrong side

**3. Column header label**
- Preview: "Price" (4th column)
- PDF: "Unit Price" (longer, slightly inconsistent)

**4. Item notes rendering**
- Both show notes, but the PDF note wrapping uses a fixed width that may not match the preview's natural column flow

**5. Quantity display**
- Preview: `{item.quantity} {item.quantityUnit}` (e.g. "5 pcs")
- PDF: `${item.quantity} ${item.quantityUnit}` — this is actually correct already

### Files to Modify

**`src/lib/quoteGenerator.ts`** — the only file that needs changing:

1. **Remove item name truncation** — change the 25-char limit to use `doc.splitTextToSize` with a sensible column width (same technique used for notes), so long names wrap instead of being cut
2. **Fix Quote Details layout** — reorder so Status appears on the right side to match the preview:
   - LEFT column: Quote #, Date, Valid Until
   - RIGHT column: Terms, Status
3. **Fix column header** — rename "Unit Price" → "Price" to match the preview header
4. **Improve item name wrapping** — instead of truncating, use `splitTextToSize` with the item name column width (~55mm), and advance `y` by the number of wrapped lines × line height, so nothing overlaps

### How Item Name Wrapping Will Work

Currently the item name column is roughly 55mm wide (from `x+2` to `x+60`). The fix will:
```
const nameLines = doc.splitTextToSize(item.itemName, 55);
doc.text(nameLines, x + 2, y);
// advance y by nameLines.length * lineHeight before drawing next row
```

This mirrors exactly how the preview renders it — the HTML table cell just wraps naturally.

### No Other Files Change

The preview dialog (`QuotePreviewDialog.tsx`) is already correct. Only the PDF generator needs updating to match it.

### Technical Notes

- `doc.splitTextToSize(text, maxWidthMm)` is the jsPDF built-in for word-wrapping — same function already used for notes
- Row height calculation will use `Math.max(nameLines.length, 1) * 7` to account for multi-line names
- The separator line between header and rows and the grey fill rect will still render cleanly since they use column positions, not row positions
