
## Allow Decimal Quantities Everywhere

### What's Changing

Currently all quantity fields are restricted to whole numbers (`integer` in the database, `parseInt` in code, and `.int()` in validation). This change allows values like `1.5`, `2.75`, `0.5`, etc. across all forms and modules.

---

### Database Migration

Seven columns need to be changed from `INTEGER` to `NUMERIC` (which supports decimals):

| Table | Column |
|---|---|
| `inventory_items` | `quantity` |
| `inventory_items` | `min_stock` |
| `job_items` | `quantity` |
| `purchase_orders` | `quantity` |
| `quote_items` | `quantity` |
| `requests` | `quantity` |
| `sale_items` | `quantity` |

The migration will be:
```sql
ALTER TABLE public.inventory_items ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.inventory_items ALTER COLUMN min_stock TYPE NUMERIC;
ALTER TABLE public.purchase_orders ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.quote_items ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.sale_items ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.requests ALTER COLUMN quantity TYPE NUMERIC;
ALTER TABLE public.job_items ALTER COLUMN quantity TYPE NUMERIC;
```

Existing whole-number data is fully compatible — `INTEGER` values convert to `NUMERIC` without any data loss.

---

### Code Changes

**`src/lib/validation.ts`**
- Remove `.int()` from `inventoryItemSchema.quantity` and `minStock`
- Remove `.int()` from `purchaseOrderItemSchema.quantity`
- Remove `.int()` from `saleItemSchema.quantity`

**`src/pages/AddItem.tsx`**
- Change `parseInt(quantity)` → `parseFloat(quantity)` for quantity
- Change `parseInt(minStock)` → `parseFloat(minStock)` for minStock
- Add `step="0.01"` to the Quantity and Min Stock Level inputs

**`src/components/AddItemDialog.tsx`**
- Same `parseInt` → `parseFloat` changes for quantity and minStock
- Add `step="0.01"` to their inputs

**`src/components/EditSaleDialog.tsx`**
- Change `parseInt(e.target.value)` → `parseFloat(e.target.value)` for item quantity
- Add `step="0.01"` to the quantity input

**`src/components/EditPurchaseOrderDialog.tsx`**
- Change `parseInt(e.target.value)` → `parseFloat(e.target.value)` for line item quantity
- Add `step="0.01"` to the quantity input

**`src/components/AddPurchaseOrderDialog.tsx`**
- Same `parseInt` → `parseFloat` and `step="0.01"` change

**`src/pages/AddPurchaseOrder.tsx`**
- Same `parseInt` → `parseFloat` changes (two instances)
- Add `step="0.01"` to quantity inputs

**`src/components/AddRequestDialog.tsx`**
- Change `parseInt(e.target.value)` → `parseFloat(e.target.value)` for quantity
- Add `step="0.01"` to the quantity input

**`src/components/EditRequestDialog.tsx`**
- Same `parseInt` → `parseFloat` and `step="0.01"` change

**`src/pages/Jobs.tsx`**
- Change the quantity stepper buttons to use `parseFloat` and increment/decrement by `0.01` steps
- Add `step="0.01"` to the inline quantity input

---

### Summary

- 1 database migration (7 column type changes)
- 10 code files updated (parseInt → parseFloat, add step="0.01")
- No data loss — all existing integer quantities remain valid
- No UI layout changes — only numeric behavior is affected
