
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

-- RLS policies
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
CREATE POLICY "Org members can view org po job links" ON public.po_job_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM purchase_orders WHERE id = po_job_links.purchase_order_id AND users_share_org(auth.uid(), user_id))
  );

-- Migrate existing data
INSERT INTO public.po_job_links (purchase_order_id, job_id)
SELECT id, job_id FROM public.purchase_orders WHERE job_id IS NOT NULL;

-- Drop the old column
ALTER TABLE public.purchase_orders DROP COLUMN job_id;
