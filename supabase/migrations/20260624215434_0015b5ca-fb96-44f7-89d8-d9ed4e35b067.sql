UPDATE public.purchase_orders po
SET
  items = deduped.items,
  sku = COALESCE(deduped.first_sku, po.sku),
  item_name = COALESCE(deduped.first_item_name, po.item_name),
  quantity = COALESCE(deduped.total_quantity, po.quantity),
  updated_at = now()
FROM (
  SELECT
    id,
    jsonb_agg(item ORDER BY ord) AS items,
    (array_agg(item->>'sku' ORDER BY ord))[1] AS first_sku,
    (array_agg(item->>'itemName' ORDER BY ord))[1] AS first_item_name,
    SUM(COALESCE(NULLIF(item->>'quantity', '')::numeric, 0)) AS total_quantity
  FROM (
    SELECT DISTINCT ON (po_inner.id, LOWER(BTRIM(COALESCE(item->>'sku', ''))))
      po_inner.id,
      item,
      ord
    FROM public.purchase_orders po_inner
    CROSS JOIN LATERAL jsonb_array_elements(po_inner.items) WITH ORDINALITY AS line(item, ord)
    WHERE jsonb_typeof(po_inner.items) = 'array'
      AND jsonb_array_length(po_inner.items) > 1
    ORDER BY po_inner.id, LOWER(BTRIM(COALESCE(item->>'sku', ''))), ord
  ) kept
  GROUP BY id
) deduped
WHERE po.id = deduped.id
  AND jsonb_typeof(po.items) = 'array'
  AND po.items IS DISTINCT FROM deduped.items;