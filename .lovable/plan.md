

## Remove Price & Total from Item Rows, Make Item Name Clickable

### Changes in `src/pages/Jobs.tsx`

**1. Remove "Price" and "Total" columns from the items table (keep category subtotal in header):**
- Remove the `<TableHead>Price</TableHead>` (line 432) and `<TableHead className="text-right">Total</TableHead>` (line 434) headers
- Remove the `<TableCell>{formatCurrency(item.unitPrice)}</TableCell>` (line 460) and `<TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>` (line 468) cells

**2. Make item name a link to Item Details:**
- In the item name cell (line 458), wrap `item.itemName` with a clickable element that navigates to `/items/${item.inventoryItemId}` when the item has an `inventoryItemId`
- Style as a link (underline on hover, primary color)
- Plain text if no `inventoryItemId`
