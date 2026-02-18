
## Show Item/Assembly Description in Sales Order Detail

### What's Missing

The Items table on the Sales Order detail page (`SalesOrderDetail.tsx`) renders each `quote.items` row with: Item Name, SKU, Qty, Unit Price, and Total. The `item.notes` field (which carries the assembly description or per-item note from the quote) is fetched and available in the data — it's just never displayed.

### The Fix — One File Change

**`src/pages/SalesOrderDetail.tsx`** — update the items table body to show notes inline beneath the item name when they exist.

The item name cell will be changed to stack the name and the note:

```tsx
<TableCell className="font-medium">
  <div>
    <span>{item.itemName}</span>
    {item.notes && (
      <p className="text-xs text-muted-foreground font-normal mt-0.5">
        {item.notes}
      </p>
    )}
  </div>
</TableCell>
```

This is the same pattern used elsewhere in the app (e.g. quote preview) — notes appear as smaller, muted text directly under the item name. No extra columns, no layout changes needed.

### No Other Files Change

- The data is already there via `useQuotes` → `quote.items` → `item.notes`
- No database changes needed
- The list view (`SalesOrders.tsx`) does not need updating — notes are a detail-page concern

### What This Covers

- Per-item notes added manually to a quote line
- Assembly descriptions, which are mapped to `notes` when an assembly is added to a quote
