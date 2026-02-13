

## Allow Multiple Jobs Linked to One Purchase Order

### Overview
Change the PO-to-Job relationship from a single `job_id` column to a many-to-many relationship using a junction table `po_job_links`. This allows one PO to be associated with multiple jobs.

### Database Change
Create a new junction table and migrate existing data:

```text
-- Create junction table
CREATE TABLE public.po_job_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(purchase_order_id, job_id)
);

-- Enable RLS
ALTER TABLE public.po_job_links ENABLE ROW LEVEL SECURITY;

-- RLS policies (access via the PO owner)
CREATE POLICY "Users can view their own po job links" ON public.po_job_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM purchase_orders WHERE id = po_job_links.purchase_order_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert their own po job links" ON public.po_job_links
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM purchase_orders WHERE id = po_job_links.purchase_order_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete their own po job links" ON public.po_job_links
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM purchase_orders WHERE id = po_job_links.purchase_order_id AND user_id = auth.uid())
  );

-- Org member view policy
CREATE POLICY "Org members can view org po job links" ON public.po_job_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM purchase_orders WHERE id = po_job_links.purchase_order_id AND users_share_org(auth.uid(), user_id))
  );

-- Migrate existing data
INSERT INTO public.po_job_links (purchase_order_id, job_id)
SELECT id, job_id FROM public.purchase_orders WHERE job_id IS NOT NULL;

-- Drop the old column
ALTER TABLE public.purchase_orders DROP COLUMN job_id;
```

### Code Changes

**1. `src/types/purchaseOrder.ts`**
- Change `jobId: string | null` to `jobIds: string[]` and `jobNumber?: string | null` to `jobNumbers?: string[]`
- Remove `job_id` from `DbPurchaseOrder`
- Update `dbToPurchaseOrder()` to accept arrays instead of single values

**2. `src/hooks/usePurchaseOrders.ts`**
- After fetching POs, also fetch `po_job_links` to build a map of `purchase_order_id -> job_id[]`
- On `createOrder`: after inserting the PO, insert rows into `po_job_links` for each selected job
- On `updateOrder`: delete existing `po_job_links` for this PO, then re-insert the new set
- Pass `jobIds` array and resolved `jobNumbers` array into `dbToPurchaseOrder()`

**3. `src/pages/AddPurchaseOrder.tsx`**
- Change `jobId` state from `string` to `string[]`
- Replace the single `<Select>` with a multi-select UI: render checkboxes or toggleable badges for each active job
- Pass `jobIds` array to `createOrder()`

**4. `src/components/EditPurchaseOrderDialog.tsx`**
- Change `jobId` state from `string` to `string[]`
- Replace single select with multi-select (same pattern as Add page)
- Initialize from `order.jobIds` array
- Pass `jobIds` array on save

**5. `src/components/PurchaseOrderCard.tsx`**
- Instead of showing one "Job: JOB-XXXX", loop through `order.jobNumbers` and display each as a badge/chip
- Handle empty array (no jobs linked)

**6. `src/pages/PurchaseOrders.tsx`**
- Update search filter: check if any of the `jobNumbers` match the query
- Pass jobs to EditDialog (already done)

**7. `src/lib/validation.ts`**
- Change `jobId` to `jobIds: z.array(z.string().uuid()).optional().default([])`

**8. `src/pages/Jobs.tsx` (Ordered badge logic)**
- Update the query: instead of `eq('job_id', job.id)`, query `po_job_links` where `job_id = job.id` to get PO IDs, then fetch those POs' items

