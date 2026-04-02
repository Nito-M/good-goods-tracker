

## Plan: Add Assembly Categories to Settings Categories Tab

### Summary
Add a new "Assembly Categories" card below the existing item categories card on the Settings > Categories tab. Rename the existing card from "Categories" to "Item Categories". Assembly categories will be stored in a new `assembly_categories` database table and managed with the same add/rename/delete pattern as item categories.

### Database Changes

**New table: `assembly_categories`**
- `id` (uuid, PK, default gen_random_uuid())
- `name` (text, not null)
- `user_id` (uuid, references auth.users, not null)
- `created_at` (timestamptz, default now())
- RLS policies: users can CRUD their own rows; org members can read shared categories

### File Changes

**New file: `src/hooks/useAssemblyCategories.ts`**
- Hook to fetch, add, rename, and delete assembly categories from the new table
- Renaming a category updates all assemblies with that type name
- Deleting a category moves assemblies to "General"

**`src/pages/Settings.tsx`**
- Rename the existing card title from "Categories" to "Item Categories" and update its description
- Import and use the new `useAssemblyCategories` hook
- Add a second Card below the item categories card with:
  - Title "Assembly Categories"
  - Add form, search, list with rename/delete (simpler than item categories -- no subcategories needed)
- Add state variables for assembly category management (new name input, editing state, delete confirmation)

**`src/pages/AssemblyTypes.tsx`**
- When creating a new type, also check against the `assembly_categories` table
- Show categories from the table as empty type cards even if no assemblies exist yet, so users can create categories first and populate them later

### Technical Details
- Assembly categories map to the `type` field on the `assemblies` table (string match by name, same pattern as item categories)
- No subcategories needed for assembly categories
- The "New Type" button on the Assemblies page will continue to work, creating a category on-the-fly

