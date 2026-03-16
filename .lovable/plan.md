

## Automatic Price Sync Plan

When an inventory item's `cost` changes, the update should cascade to:
1. **Assembly Items** (`assembly_items.unit_cost`) — where `inventory_item_id` links to the changed item
2. **Part Inventory Items** (`part_inventory_items.unit_cost`) — where `inventory_item_id` links to the changed item

### Approach: Database Triggers

Create two PostgreSQL triggers on `inventory_items` that fire on `UPDATE` of the `cost` column:

**Trigger 1 — Sync to `assembly_items`**
When `inventory_items.cost` changes, update `assembly_items.unit_cost` for all rows where `inventory_item_id = OLD.id`.

**Trigger 2 — Sync to `part_inventory_items`**
When `inventory_items.cost` changes, update `part_inventory_items.unit_cost` for all rows where `inventory_item_id = OLD.id`.

### Migration SQL (single migration)

```sql
-- Function: sync cost to assembly_items
CREATE OR REPLACE FUNCTION public.sync_inventory_cost_to_assemblies()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.cost IS DISTINCT FROM NEW.cost THEN
    UPDATE public.assembly_items
    SET unit_cost = NEW.cost
    WHERE inventory_item_id = NEW.id;

    UPDATE public.part_inventory_items
    SET unit_cost = NEW.cost
    WHERE inventory_item_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on inventory_items
CREATE TRIGGER sync_inventory_cost_trigger
AFTER UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_cost_to_assemblies();
```

### What This Achieves

- **Assemblies**: Any assembly referencing an inventory item will always have the latest `unit_cost`, so total cost calculations stay current.
- **Part Inventory Items**: Parts linked to inventory items will reflect current costs.
- **No code changes needed** — the sync happens at the database level, and existing hooks already read `unit_cost` from these tables.
- **Parts Assemblies**: `parts_assembly_items` has no cost column (cost comes from the linked part's price or inventory), so no update needed there.

### Summary

One migration with one trigger function handles the entire cascade. No frontend code changes required.

