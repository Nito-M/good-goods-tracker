
Remove Parts Library 2 (and Parts Assemblies 2) from the system entirely.

## Scope

Per memory `mem://features/parts-library-2`, Parts Library 2 / Parts Assemblies 2 are isolated clones with their own tables, hooks, pages, storage bucket, and landing-page tiles. I'll remove all of it.

## Frontend changes

**Delete files:**
- `src/pages/PartsLibrary2.tsx`
- `src/pages/PartDetail2.tsx`
- `src/pages/PartsAssemblies2.tsx`
- `src/pages/PartsAssembliesDetail2.tsx`
- `src/pages/AddPart2.tsx`
- `src/hooks/useParts2.ts`
- `src/hooks/usePartFolders2.ts`
- `src/hooks/usePartInventoryItems2.ts`
- `src/hooks/useManufacturingSteps2.ts`
- `src/hooks/useStepImages2.ts`
- `src/hooks/usePartsAssemblies2.ts`
- `src/components/FullScreenPartsPicker2.tsx`
- `src/components/ManufacturingInstructions2.tsx`
- `src/components/PartsCsvImport2.tsx`

**Edit:**
- `src/App.tsx` — remove all `/parts/library2`, `/parts/assemblies2`, `/parts/add2`, `/parts/:id/detail2`, etc. routes and their imports.
- `src/pages/PartsLanding.tsx` — drop the `parts-library-2` and `parts-assemblies-2` tiles (keep only the two original ones), and remove `useParts2` import/usage.
- `src/components/AppSidebar.tsx` — remove any sidebar links pointing to library2/assemblies2 (will verify and clean).

## Backend changes (migration)

Drop the secondary tables and storage bucket so nothing lingers:
- `DROP TABLE` (CASCADE) for: `part_step_images_2`, `part_manufacturing_steps_2`, `part_inventory_items_2`, `parts_assembly_items_2`, `parts_assemblies_2`, `parts_2`, `part_folders_2`.
- Delete all objects in the `part-images-2` storage bucket, then delete the bucket.
- Drop any associated triggers/functions/policies that reference `*_2` tables (will be removed via CASCADE).

## Notes
- Permanent and irreversible — all data in Parts Library 2 will be deleted.
- The original Parts Library and Parts Assemblies are untouched.
- The Parts landing page will show just the two original tiles.
