

## Plan: Auto-sync Parts Assembly price into Assemblies

### Problem
When a Parts Assembly is added to an Assembly, its cost is snapshotted as a static `unit_cost` value. There is no link back to the source Parts Assembly, so when the Parts Assembly's contents change (items added, prices updated), the Assembly item's cost stays stale.

### Solution

#### 1. Database: Add `parts_assembly_id` column to `assembly_items`
Add a nullable foreign key column `parts_assembly_id` on `assembly_items` that references `parts_assemblies.id`. This creates the missing link.

```sql
ALTER TABLE public.assembly_items
  ADD COLUMN parts_assembly_id uuid REFERENCES public.parts_assemblies(id) ON DELETE SET NULL;
```

#### 2. Database: Create a trigger function to recalculate and push updated costs
Create a function that, when triggered, recalculates the total cost of a parts assembly (by summing `parts_assembly_items.quantity * parts.price` for all its items) and updates all `assembly_items` rows that reference that parts assembly.

The trigger fires on:
- **INSERT/UPDATE/DELETE on `parts_assembly_items`** — when items are added, removed, or quantities change
- **UPDATE on `parts` (price column)** — when a part's price changes (already handled by the existing inventory cost cascade for parts linked to inventory items, but we also need to push changes to assemblies via parts assemblies)

```sql
-- Function: recalculate parts assembly cost and push to assembly_items
CREATE OR REPLACE FUNCTION public.sync_parts_assembly_cost_to_assemblies()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  _assembly_id uuid;
  _total_cost numeric;
BEGIN
  -- Determine which parts_assembly was affected
  IF TG_TABLE_NAME = 'parts_assembly_items' THEN
    _assembly_id := COALESCE(NEW.assembly_id, OLD.assembly_id);
  ELSIF TG_TABLE_NAME = 'parts' THEN
    -- Find all parts assemblies containing this part
    FOR _assembly_id IN
      SELECT DISTINCT pai.assembly_id
      FROM parts_assembly_items pai
      WHERE pai.part_id = NEW.id
    LOOP
      SELECT COALESCE(SUM(pai.quantity * COALESCE(p.price, 0)), 0)
      INTO _total_cost
      FROM parts_assembly_items pai
      LEFT JOIN parts p ON p.id = pai.part_id
      WHERE pai.assembly_id = _assembly_id;

      UPDATE assembly_items
      SET unit_cost = _total_cost
      WHERE parts_assembly_id = _assembly_id;
    END LOOP;
    RETURN NEW;
  END IF;

  -- Calculate total cost for this parts assembly
  SELECT COALESCE(SUM(pai.quantity * COALESCE(p.price, 0)), 0)
  INTO _total_cost
  FROM parts_assembly_items pai
  LEFT JOIN parts p ON p.id = pai.part_id
  WHERE pai.assembly_id = _assembly_id;

  -- Update all assembly_items linked to this parts assembly
  UPDATE assembly_items
  SET unit_cost = _total_cost
  WHERE parts_assembly_id = _assembly_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger on parts_assembly_items changes
CREATE TRIGGER sync_pa_cost_on_items_change
AFTER INSERT OR UPDATE OR DELETE ON public.parts_assembly_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_parts_assembly_cost_to_assemblies();

-- Trigger on parts price changes
CREATE TRIGGER sync_pa_cost_on_part_price_change
AFTER UPDATE OF price ON public.parts
FOR EACH ROW
EXECUTE FUNCTION public.sync_parts_assembly_cost_to_assemblies();
```

#### 3. Frontend: Set `parts_assembly_id` when adding a parts assembly to an assembly
In `src/pages/Assemblies.tsx`, update `handleAddPartsAssembly` to include `parts_assembly_id` in the insert. This requires a small change to `useAssemblies.ts` `addItem` to accept and pass through `parts_assembly_id`.

**`src/hooks/useAssemblies.ts`** — Update `addItem` parameter type and insert:
- Add `parts_assembly_id?: string | null` to the item parameter
- Include it in the insert call

**`src/pages/Assemblies.tsx`** — Pass `parts_assembly_id: partsAssemblyId` when calling `addItem` in `handleAddPartsAssembly`.

### Summary
- 1 migration: add column + trigger function + 2 triggers
- 2 file edits: `useAssemblies.ts` and `Assemblies.tsx`
- Result: Any change to a Parts Assembly's items or part prices automatically recalculates and updates the cost in all Assemblies referencing it

