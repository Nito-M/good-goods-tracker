
-- Create tax-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tax-documents', 'tax-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create a table to track uploaded tax documents
CREATE TABLE public.tax_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT NOT NULL DEFAULT 'image',
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tax documents"
  ON public.tax_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax documents"
  ON public.tax_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax documents"
  ON public.tax_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Storage RLS for tax-documents bucket
CREATE POLICY "Users can upload tax documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own tax documents storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own tax documents storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
