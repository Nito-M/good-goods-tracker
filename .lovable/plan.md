## Goal

Let a prebuilt Assembly include other prebuilt Assemblies as line items, with each nested assembly rendered as a clickable link that opens that assembly's detail.

Today the picker only attaches `parts_assemblies` (small component assemblies). Full Assemblies can only be added by copying their items in, and any "link" relies on a fragile name match.

## What changes

### 1. Database
Add a new nullable FK column on `assembly_items`:
- `nested_assembly_id uuid` referencing `assemblies(id)` on delete set null
- Index on `nested_assembly_id`

Existing `parts_assembly_id` stays untouched (still used for parts_assemblies).

### 2. Picker
Extend `FullScreenSubAssemblyPicker` to accept a third source: full Assemblies (excluding the current one to prevent self-nesting). Add a tab/section labeled "Assemblies" alongside the existing "Parts Assemblies" tab. Filter out the current assembly id from the list.

### 3. Add flow (`Assemblies.tsx`)
In `handleAddSubAssemblies`, handle a new `source: 'assembly'` case:
- Look up the chosen assembly
- Compute its cost by summing `assembly_items.unit_cost * quantity`
- Use `selling_price` if set, else computed cost as `unit_cost`
- Insert an `assembly_items` row with `nested_assembly_id` set, `item_name = assembly.name`, qty 1

Prevent duplicates by checking existing `nested_assembly_id` values, same as the current parts-assembly check.

### 4. Render with link-back
In the items list, replace the brittle name-match `assemblyMatch` with a direct lookup:
- If `item.nested_assembly_id` is set, link to `/assemblies/{type}?id={nested_assembly_id}`
- Add a small "Assembly" badge next to the name so it's visually distinct from inventory parts and parts-assemblies
- Keep the existing fallback name-match for legacy rows (so old data still links)

### 5. Hook updates (`useAssemblies.ts`)
- Add `nested_assembly_id` to the `AssemblyItem` interface
- Include it in the addItem signature and the insert payload
- Include it in the duplicate check

### 6. Cost sync
Add a trigger so when a nested assembly's items change (or its `selling_price` changes), parent rows referencing it via `nested_assembly_id` recompute `unit_cost`. Mirrors the existing `sync_parts_assembly_cost_to_assemblies` pattern.

## Out of scope
- Recursive expansion (showing nested items inline as a tree) — link-back is enough
- Cycle detection beyond blocking self-nesting (deep cycles are unlikely; can revisit if needed)
- PDF changes — nested assembly will print as a single line item like today

## Files touched
- new migration (column + index + cost sync trigger)
- `src/hooks/useAssemblies.ts`
- `src/components/FullScreenSubAssemblyPicker.tsx`
- `src/pages/Assemblies.tsx`
