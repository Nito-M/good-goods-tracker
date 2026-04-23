
## Goal
Make the board PDF print upright (portrait) and fit the paper, instead of the current sideways (landscape) layout.

## Current behavior
`src/lib/boardPdfGenerator.ts` generates the PDF with:
```ts
new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
```
This is why your printout comes out sideways. Boards with many columns also currently rely on landscape width to fit.

## Plan

1. **Switch to portrait A4** in `src/lib/boardPdfGenerator.ts`.
2. **Auto-fit content to page width** so all columns fit on the upright page:
   - Compute available width = page width − left/right margins.
   - Pass `tableWidth: availableWidth` to `autoTable`.
   - Let autoTable distribute columns; for very wide boards, also set `styles.overflow: 'linebreak'` (already set) and a smaller `fontSize` (e.g. drop from 9 → 8) when column count is high (e.g. >6 columns) so text wraps cleanly instead of overflowing.
3. **Keep merges, status colors, and alignment** working — no changes to row/column geometry logic, only orientation + width fitting.
4. **Footer + header positions** recalculated from the new (portrait) page width so "Generated …" and page numbers stay correctly right-aligned.

## Technical details

File: `src/lib/boardPdfGenerator.ts`
- Change `orientation: 'landscape'` → `orientation: 'portrait'`.
- After creating `doc`, derive `pageWidth` (already done) and pass `tableWidth: pageWidth - 80` (40pt margin each side) into each `autoTable` call.
- Adjust `styles.fontSize` dynamically: `columns.length > 6 ? 8 : 9`.
- No DB or UI changes. No other files touched.

## Out of scope
- No new "orientation" setting in the UI (can be added later if you want a toggle).
- No changes to on-screen board rendering.
