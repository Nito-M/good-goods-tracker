# Explode sub assemblies into individual linked items

When a sub assembly is added to an assembly, instead of inserting one summary row, insert one row per part/item that lives inside that sub assembly. Each new row links back to its root part or inventory item.

## Behaviour

- Adding a sub assembly adds each of its contents as its own line in the assembly parts list.
- Each line keeps a real link to its source: inventory items link to the item page, parts link to the part page (same link behaviour already used for manually added rows).
- Quantities multiply: sub assembly quantity x the item quantity inside the sub assembly.
- Cost per line comes from the linked source (part price or inventory cost), so the assembly total stays accurate and keeps auto-updating when source costs change.
- Each added line gets a note noting which sub assembly it came from (e.g. "From: Hopper Frame"), so the origin is still visible.
- No standalone sub assembly summary row is created anymore.
- If a sub assembly has no items, nothing is added and a short message says the sub assembly is empty.

## Technical notes

- In `src/pages/Assemblies.tsx`, the `parts1` branch of the sub assembly add handler currently computes a rolled-up price and calls `addItem` once with `parts_assembly_id`. Replace that with: fetch `parts_assembly_items` for the selected sub assembly (already selecting `quantity, part_id, inventory_item_id, part_name, part_sku, parts ( price ), inventory_items ( cost )`), then loop and call `addItem` per row with `inventory_item_id` / `part_id` set, `item_name`/`sku` from the row (falling back to the part/inventory record), `quantity` multiplied, and `unit_cost` from part price or inventory cost.
- No schema change needed: `assembly_items` already has `part_id` and `inventory_item_id`, which the existing row renderer uses to build links.
- Existing rows already stored with `parts_assembly_id` are left untouched.
