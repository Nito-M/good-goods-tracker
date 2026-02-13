

## Hide SKU Column, Show in Expandable Row

### What Changes
Remove the "SKU" column from the All Job Items table and display it in the expandable detail row alongside the Jobs list.

### File to Update

**`src/pages/AllJobItems.tsx`**

1. Remove the `<TableHead>SKU</TableHead>` column header
2. Remove the `<TableCell>` that displays `item.sku`
3. Add the SKU to the expandable detail row, shown alongside the Jobs badges
4. Update `colSpan` from 5 to 4 on the detail row

### Detail Row Layout
When expanded, the row will show:
- **SKU:** (mono-styled) followed by the SKU value
- **Jobs:** followed by job name badges

