
# Show Measurement Unit for Length per Piece

## What changes
On the Item Details page, the "Length per Piece" value currently shows just a number (e.g., "12"). It should also display the item's quantity unit so it reads something like "12 ft" or "12 in".

## Technical detail

### File: `src/pages/ItemDetails.tsx` (1 small edit)
- On the line that displays `item.pieceLength`, append the unit label from `QUANTITY_UNIT_LABELS[item.quantityUnit]` (or fall back to the raw `quantityUnit` value)
- Change from: `{item.pieceLength}` to: `{item.pieceLength} {QUANTITY_UNIT_LABELS[item.quantityUnit]}`
- Import `QUANTITY_UNIT_LABELS` from `@/types/inventory`
