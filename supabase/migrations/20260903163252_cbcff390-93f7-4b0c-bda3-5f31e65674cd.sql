CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  user_id uuid,
  table_name text NOT NULL,
  record_id uuid,
  record_label text,
  action text NOT NULL,
  changed_fields jsonb,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view activity logs"
ON public.activity_logs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (organization_id IS NOT NULL AND public.is_org_admin_or_owner(auth.uid(), organization_id))
  OR (organization_id IS NULL AND user_id = auth.uid())
);

CREATE INDEX idx_activity_logs_org_created ON public.activity_logs (organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_created ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_record ON public.activity_logs (record_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs (action);
CREATE INDEX idx_activity_logs_table ON public.activity_logs (table_name);

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old jsonb;
  _new jsonb;
  _row jsonb;
  _action text;
  _label text;
  _org uuid;
  _row_user uuid;
  _changed jsonb := '{}'::jsonb;
  _k text;
  _actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    _new := to_jsonb(NEW);
    _row := _new;
    _action := 'insert';
  ELSIF TG_OP = 'DELETE' THEN
    _old := to_jsonb(OLD);
    _row := _old;
    _action := 'delete';
  ELSE
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    _row := _new;
    _action := 'update';
    FOR _k IN SELECT jsonb_object_keys(_new) LOOP
      IF _k NOT IN ('updated_at') AND (_new -> _k) IS DISTINCT FROM (_old -> _k) THEN
        _changed := _changed || jsonb_build_object(_k, jsonb_build_array(_old -> _k, _new -> _k));
      END IF;
    END LOOP;
    IF _changed = '{}'::jsonb THEN
      RETURN NULL;
    END IF;
    IF (_new ? 'deleted_at') AND (_old ->> 'deleted_at') IS NULL AND (_new ->> 'deleted_at') IS NOT NULL THEN
      _action := 'delete';
    END IF;
  END IF;

  _label := COALESCE(
    NULLIF(_row ->> 'name', ''),
    NULLIF(_row ->> 'po_number', ''),
    NULLIF(_row ->> 'invoice_number', ''),
    NULLIF(_row ->> 'quote_number', ''),
    NULLIF(_row ->> 'job_number', ''),
    NULLIF(_row ->> 'request_number', ''),
    NULLIF(_row ->> 'title', ''),
    NULLIF(_row ->> 'item_name', ''),
    NULLIF(_row ->> 'part_name', ''),
    NULLIF(_row ->> 'sku', ''),
    NULLIF(_row ->> 'description', '')
  );
  _label := LEFT(_label, 300);

  BEGIN
    _row_user := NULLIF(_row ->> 'user_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    _row_user := NULL;
  END;

  BEGIN
    _org := NULLIF(_row ->> 'organization_id', '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    _org := NULL;
  END;

  IF _org IS NULL THEN
    SELECT om.organization_id INTO _org
    FROM public.organization_members om
    WHERE om.user_id = COALESCE(_row_user, _actor)
    LIMIT 1;
  END IF;

  INSERT INTO public.activity_logs (
    organization_id, user_id, table_name, record_id, record_label,
    action, changed_fields, old_data, new_data
  ) VALUES (
    _org,
    COALESCE(_actor, _row_user),
    TG_TABLE_NAME,
    NULLIF(_row ->> 'id', '')::uuid,
    _label,
    _action,
    CASE WHEN TG_OP = 'UPDATE' THEN _changed ELSE NULL END,
    _old,
    _new
  );

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'inventory_items','item_vendor_prices','item_location_quantities',
    'vendors','customers','workers',
    'purchase_orders','requests',
    'quotes','quote_items','sales','sale_items',
    'jobs','job_items',
    'assemblies','assembly_items',
    'parts_assemblies','parts_assembly_items','parts',
    'sops','sop_steps','sop_bom_items',
    'bank_cards','bank_transactions'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_log_activity ON public.%I', t);
      EXECUTE format('CREATE TRIGGER trg_log_activity AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_activity()', t);
    END IF;
  END LOOP;
END $$;