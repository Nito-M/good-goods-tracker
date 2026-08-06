# Rename to Sub Assemblies and remove Parts Assemblies 2

## What changes

1. On the Parts page, the "Parts Assemblies" card becomes **Sub Assemblies**, and its name is fixed — the pencil/rename control is gone for that card. The Parts Library card stays renameable.
2. The "Parts Assemblies 2" card, its pages, and its routes are removed entirely. Any place that offered v2 items as a sub-assembly source stops referencing it.
3. Page headings inside the Sub Assemblies section read "Sub Assemblies" instead of "Parts Assemblies".

## Technical details

- `src/pages/PartsLanding.tsx`: drop the `parts-assemblies-v2` section entry and its default name; set `parts-assemblies` label to a fixed "Sub Assemblies" (not editable, no pencil button); keep localStorage renaming only for `parts-library`. Stale saved names for the removed keys are ignored.
- Delete `src/pages/PartsAssembliesV2.tsx`, `src/pages/PartsAssembliesDetailV2.tsx`, `src/hooks/usePartsAssembliesV2.ts`.
- `src/App.tsx`: remove the two imports and the `/parts/assemblies-v2` and `/parts/assemblies-v2/:type` routes.
- `src/pages/PartsAssembliesDetail.tsx` and `src/hooks/usePartsAssemblies.ts`: remove use of `usePartsAssembliesV2` / v2 lookups and any v2 option in the add-item flow. The `parts_assembly_v2_id` column stays in the type/insert shape as null-only so existing rows still read correctly.
- `src/pages/PartsAssemblies.tsx`: header title/subtitle wording updated to "Sub Assemblies".

## Not included

No database changes — the `parts_assemblies_v2` / `parts_assembly_v2_items` tables are left in place (unused) so no data is destroyed. Say the word if you want them dropped too.
