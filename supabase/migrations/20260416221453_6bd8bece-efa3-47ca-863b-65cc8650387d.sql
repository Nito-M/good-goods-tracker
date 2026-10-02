ALTER TABLE public.parts_assembly_items
ADD COLUMN IF NOT EXISTS parts_assembly_v2_id uuid;

CREATE TABLE IF NOT EXISTS public.parts_assemblies_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  selling_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_finished',
  status_notes text,
  type text NOT NULL DEFAULT 'General',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parts_assembly_v2_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id uuid NOT NULL REFERENCES public.parts_assemblies_v2(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.parts(id) ON DELETE SET NULL,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  parts_assembly_id uuid REFERENCES public.parts_assemblies(id) ON DELETE SET NULL,
  part_name text NOT NULL,
  part_sku text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_assembly_items
  ADD CONSTRAINT parts_assembly_items_parts_assembly_v2_id_fkey
  FOREIGN KEY (parts_assembly_v2_id)
  REFERENCES public.parts_assemblies_v2(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_parts_assemblies_v2_user_id
  ON public.parts_assemblies_v2(user_id);

CREATE INDEX IF NOT EXISTS idx_parts_assembly_v2_items_assembly_id
  ON public.parts_assembly_v2_items(assembly_id);

CREATE INDEX IF NOT EXISTS idx_parts_assembly_v2_items_part_id
  ON public.parts_assembly_v2_items(part_id);

CREATE INDEX IF NOT EXISTS idx_parts_assembly_v2_items_inventory_item_id
  ON public.parts_assembly_v2_items(inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_parts_assembly_v2_items_parts_assembly_id
  ON public.parts_assembly_v2_items(parts_assembly_id);

CREATE INDEX IF NOT EXISTS idx_parts_assembly_items_parts_assembly_v2_id
  ON public.parts_assembly_items(parts_assembly_v2_id);

ALTER TABLE public.parts_assemblies_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_assembly_v2_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shared org users can view parts assemblies v2" ON public.parts_assemblies_v2;
DROP POLICY IF EXISTS "Shared org users can create parts assemblies v2" ON public.parts_assemblies_v2;
DROP POLICY IF EXISTS "Shared org users can update parts assemblies v2" ON public.parts_assemblies_v2;
DROP POLICY IF EXISTS "Shared org users can delete parts assemblies v2" ON public.parts_assemblies_v2;

CREATE POLICY "Shared org users can view parts assemblies v2"
ON public.parts_assemblies_v2
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id)
);

CREATE POLICY "Shared org users can create parts assemblies v2"
ON public.parts_assemblies_v2
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id)
);

CREATE POLICY "Shared org users can update parts assemblies v2"
ON public.parts_assemblies_v2
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id)
)
WITH CHECK (
  auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id)
);

CREATE POLICY "Shared org users can delete parts assemblies v2"
ON public.parts_assemblies_v2
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id)
);

DROP POLICY IF EXISTS "Shared org users can view parts assembly v2 items" ON public.parts_assembly_v2_items;
DROP POLICY IF EXISTS "Shared org users can create parts assembly v2 items" ON public.parts_assembly_v2_items;
DROP POLICY IF EXISTS "Shared org users can update parts assembly v2 items" ON public.parts_assembly_v2_items;
DROP POLICY IF EXISTS "Shared org users can delete parts assembly v2 items" ON public.parts_assembly_v2_items;

CREATE POLICY "Shared org users can view parts assembly v2 items"
ON public.parts_assembly_v2_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parts_assemblies_v2 pa
    WHERE pa.id = parts_assembly_v2_items.assembly_id
      AND (pa.user_id = auth.uid() OR public.users_share_org(auth.uid(), pa.user_id))
  )
);

CREATE POLICY "Shared org users can create parts assembly v2 items"
ON public.parts_assembly_v2_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.parts_assemblies_v2 pa
    WHERE pa.id = parts_assembly_v2_items.assembly_id
      AND (pa.user_id = auth.uid() OR public.users_share_org(auth.uid(), pa.user_id))
  )
);

CREATE POLICY "Shared org users can update parts assembly v2 items"
ON public.parts_assembly_v2_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parts_assemblies_v2 pa
    WHERE pa.id = parts_assembly_v2_items.assembly_id
      AND (pa.user_id = auth.uid() OR public.users_share_org(auth.uid(), pa.user_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.parts_assemblies_v2 pa
    WHERE pa.id = parts_assembly_v2_items.assembly_id
      AND (pa.user_id = auth.uid() OR public.users_share_org(auth.uid(), pa.user_id))
  )
);

CREATE POLICY "Shared org users can delete parts assembly v2 items"
ON public.parts_assembly_v2_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parts_assemblies_v2 pa
    WHERE pa.id = parts_assembly_v2_items.assembly_id
      AND (pa.user_id = auth.uid() OR public.users_share_org(auth.uid(), pa.user_id))
  )
);

CREATE OR REPLACE FUNCTION public.sync_parts_assembly_v2_to_v1_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.parts_assembly_items
    SET part_name = COALESCE(part_name, ''),
        part_sku = COALESCE(part_sku, '')
    WHERE parts_assembly_v2_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.parts_assembly_items
    SET part_name = NEW.name,
        part_sku = COALESCE(NEW.type, '')
    WHERE parts_assembly_v2_id = NEW.id;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_parts_assemblies_v2_to_v1_items_trigger ON public.parts_assemblies_v2;
CREATE TRIGGER sync_parts_assemblies_v2_to_v1_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.parts_assemblies_v2
FOR EACH ROW
EXECUTE FUNCTION public.sync_parts_assembly_v2_to_v1_items();

DROP TRIGGER IF EXISTS update_parts_assemblies_v2_updated_at ON public.parts_assemblies_v2;
CREATE TRIGGER update_parts_assemblies_v2_updated_at
BEFORE UPDATE ON public.parts_assemblies_v2
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();