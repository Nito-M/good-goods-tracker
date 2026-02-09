
-- Create table for user page permissions
CREATE TABLE public.user_page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_key)
);

ALTER TABLE public.user_page_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all permissions
CREATE POLICY "Admins can view all permissions"
  ON public.user_page_permissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert permissions"
  ON public.user_page_permissions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete permissions"
  ON public.user_page_permissions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can read their own permissions
CREATE POLICY "Users can view their own permissions"
  ON public.user_page_permissions FOR SELECT
  USING (auth.uid() = user_id);
