-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pdf_url TEXT,
  image_url TEXT,
  sku TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'received')),
  ordered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own purchase orders"
ON public.purchase_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase orders"
ON public.purchase_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders"
ON public.purchase_orders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders"
ON public.purchase_orders FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for PO files
INSERT INTO storage.buckets (id, name, public) VALUES ('purchase-orders', 'purchase-orders', true);

-- Storage policies for purchase-orders bucket
CREATE POLICY "Users can upload their own PO files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'purchase-orders' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own PO files"
ON storage.objects FOR SELECT
USING (bucket_id = 'purchase-orders' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own PO files"
ON storage.objects FOR DELETE
USING (bucket_id = 'purchase-orders' AND auth.uid()::text = (storage.foldername(name))[1]);