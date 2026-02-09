
-- Create org_requesters table to link requester names with user accounts
CREATE TABLE public.org_requesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  linked_user_id uuid DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_requesters ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's requesters
CREATE POLICY "Org members can view org requesters"
  ON public.org_requesters FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Org admins can insert requesters
CREATE POLICY "Org admins can insert requesters"
  ON public.org_requesters FOR INSERT
  WITH CHECK (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Org admins can update requesters
CREATE POLICY "Org admins can update requesters"
  ON public.org_requesters FOR UPDATE
  USING (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Org admins can delete requesters
CREATE POLICY "Org admins can delete requesters"
  ON public.org_requesters FOR DELETE
  USING (is_org_admin_or_owner(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'::app_role));
