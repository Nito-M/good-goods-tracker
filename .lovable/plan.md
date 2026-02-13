

## Add "Need" Column to All Job Items

### What Changes
Add a new column called "Need" that shows the difference between Total Qty required and current In Stock quantity. This tells you how many more parts you need to acquire.

### Formula
**Need = Total Qty - In Stock**
- If the result is 0 or negative (enough stock), show 0 or a dash
- If positive, show the shortage amount (optionally highlighted)

### File to Update

**`src/pages/AllJobItems.tsx`**

1. Add a new `<TableHead>` column: "Need" (right-aligned, after "In Stock")
2. Add a new `<TableCell>` that calculates `Math.max(0, item.totalQty - inStock)` where inStock is the numeric inventory quantity
3. When inventory data is unavailable (no linked inventory item), show a dash
4. When need is greater than 0, style it with a warning color (e.g., red/destructive text) to draw attention to shortages
5. Update the detail row `colSpan` from 4 to 5

### Table Layout After Change
| Item Name | Total Qty | In Stock | Need | Unit Price |

