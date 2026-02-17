
## Save and Use the Selected Company on Purchase Orders

### The Problem
The Company Selector exists on both the Create and Edit PO forms, but the selected `companyId` is never actually saved to the database. So every PO ends up with `company_id: null`, and the PDF always falls back to the default company.

### Root Cause
Three places need fixing:

1. **Create PO** (`src/pages/AddPurchaseOrder.tsx`) -- `companyId` is not passed to `createOrder()`
2. **`createOrder` in hook** (`src/hooks/usePurchaseOrders.ts`) -- doesn't accept or insert `company_id`
3. **`updateOrder` in hook** (`src/hooks/usePurchaseOrders.ts`) -- doesn't accept or save `company_id`
4. **Edit PO dialog** (`src/components/EditPurchaseOrderDialog.tsx`) -- `companyId` is not passed in the `onSave()` call

### Changes

**`src/hooks/usePurchaseOrders.ts`**
- Add `companyId?: string | null` to the `createOrder` parameter type
- Include `company_id: order.companyId || null` in the insert query
- Add `companyId?: string | null` to the `updateOrder` updates parameter type
- Include `company_id` in the update query

**`src/pages/AddPurchaseOrder.tsx`**
- Pass `companyId` into the `createOrder()` call

**`src/components/EditPurchaseOrderDialog.tsx`**
- Add `companyId` to the `onSave` type signature
- Pass `companyId` in the `onSave()` call

**`src/pages/PurchaseOrders.tsx`**
- Update the `EditPurchaseOrderDialog` `onSave` type to include `companyId`

### Result
When you select a company on a PO, that company's logo, name, address, and contact info will appear on the PDF -- not just the default company.
