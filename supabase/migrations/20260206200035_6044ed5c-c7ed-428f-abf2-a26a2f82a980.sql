-- Create requests table for tracking custom item requests
CREATE TABLE public.requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  sku text,
  quantity integer NOT NULL DEFAULT 1,
  quantity_unit text NOT NULL DEFAULT 'pcs',
  link text,
  notes text,
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own requests" 
ON public.requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests" 
ON public.requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" 
ON public.requests FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests" 
ON public.requests FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_requests_updated_at
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for request images
INSERT INTO storage.buckets (id, name, public) VALUES ('request-images', 'request-images', true);

-- Storage policies for request images
CREATE POLICY "Users can upload their own request images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'request-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own request images"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own request images"
ON storage.objects FOR DELETE
USING (bucket_id = 'request-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view request images"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-images');