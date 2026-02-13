

## Add Job Number Linking to Purchase Orders

### Overview
Add the ability to associate a Purchase Order with a Job (JOB-XXXX), similar to how POs can already be linked to Requests (REQ-XXXX). The job number will appear on PO cards and be selectable during creation and editing.

### Database Change
Add a nullable `job_id` column to the `purchase_orders` table:

```text
ALTER TABLE public.purchase_orders ADD COLUMN job_id uuid;
```

### Code Changes

**1. `src/types/purchaseOrder.ts`**
- Add `jobId: string | null` and `jobNumber?: string | null` to the `PurchaseOrder` interface
- Add `job_id: string | null` to the `DbPurchaseOrder` interface
- Map the new field in `dbToPurchaseOrder()`

**2. `src/hooks/usePurchaseOrders.ts`**
- Fetch jobs (`id, job_number`) alongside vendors and requests in `fetchOrders()`
- Build a job lookup map and pass `jobNumber` into `dbToPurchaseOrder()`
- Accept `jobId` in `createOrder()` and `updateOrder()` parameters
- Persist `job_id` on insert and update

**3. `src/pages/AddPurchaseOrder.tsx`**
- Import and use `useJobs` hook to get the jobs list
- Add a Job selector dropdown in the "Order Details" section (similar to the existing Request selector)
- Pass `jobId` through to `createOrder()`

**4. `src/components/EditPurchaseOrderDialog.tsx`**
- Accept jobs list as a prop (or use `useJobs` directly)
- Add a Job selector dropdown
- Initialize from `order.jobId` and pass through on save
- Update the `onSave` type to include `jobId`

**5. `src/components/PurchaseOrderCard.tsx`**
- Display the linked job number in the details grid (next to Request), with a Briefcase icon
- Format as "Job: JOB-XXXX"

**6. `src/pages/PurchaseOrders.tsx`**
- Pass jobs data to the Edit dialog if needed
- Add job number to the search filter so users can search POs by job number

**7. `src/lib/validation.ts`**
- Add `jobId: z.string().uuid().optional().nullable()` to the `purchaseOrderSchema`

