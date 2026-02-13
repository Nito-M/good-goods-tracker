

## Allow More Decimal Places in Prices (5 Decimals)

### What Changes
Update price formatting and input fields across the app to support up to 5 decimal places instead of the current 2.

### Changes Overview

**1. Create a shared `formatCurrency` utility** in `src/lib/utils.ts`
- One reusable function with `minimumFractionDigits: 2` and `maximumFractionDigits: 5`
- This means $1.50 still shows as $1.50, but $1.12345 shows all 5 digits

**2. Replace all inline `formatCurrency` definitions** (found in ~15 files):
- `src/components/InventoryTable.tsx`
- `src/components/PurchaseOrderCard.tsx`
- `src/components/EditSaleDialog.tsx`
- `src/components/EditQuoteDialog.tsx`
- `src/components/SaleCard.tsx`
- `src/components/QuoteCard.tsx`
- `src/components/RequestCard.tsx`
- `src/pages/Bank.tsx`
- `src/pages/Jobs.tsx`
- `src/pages/JobAddItems.tsx`
- `src/pages/AllJobItems.tsx`
- `src/pages/ItemDetails.tsx`
- `src/lib/invoiceGenerator.ts`
- `src/lib/purchaseOrderGenerator.ts`
- `src/lib/quoteGenerator.ts`

Each file will import from `@/lib/utils` instead of defining its own.

**3. Update number input `step` attributes** from `"0.01"` to `"0.00001"` in all price/cost input fields:
- `src/pages/AddItem.tsx`
- `src/pages/AddPurchaseOrder.tsx`
- `src/components/AddRequestDialog.tsx`
- `src/components/EditPurchaseOrderDialog.tsx`
- `src/components/EditRequestDialog.tsx`
- `src/components/EditQuoteDialog.tsx`
- `src/components/EditSaleDialog.tsx`
- `src/pages/Bank.tsx`

**4. Keep Index.tsx dashboard** formatting at 0 decimals (it currently shows rounded totals intentionally).

### Behavior
- Prices display with a minimum of 2 and maximum of 5 decimal places (trailing zeros beyond 2 are trimmed)
- Examples: `$5.00`, `$12.345`, `$0.00001`, `$99.12345`
- Users can type up to 5 decimal places in all price inputs

