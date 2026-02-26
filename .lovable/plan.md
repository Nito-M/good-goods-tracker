

# Add Subcategories to Settings

## Overview
Add a subcategory management system that lets you organize inventory items with a two-level hierarchy: Category > Subcategory. Each subcategory belongs to a parent category.

## Database Changes

Create a new `subcategories` table:
- `id` (uuid, primary key)
- `category_id` (uuid, references categories.id, on delete cascade)
- `user_id` (uuid, not null)
- `name` (text, not null)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- Unique constraint on (category_id, name) to prevent duplicates within a category

RLS policies mirroring the categories table:
- Users can CRUD their own subcategories
- Org members can view org subcategories (via `users_share_org`)

## New Hook: `useSubcategories`

Create `src/hooks/useSubcategories.ts` following the same pattern as `useCategories`:
- Fetch all subcategories for the user
- `addSubcategory(categoryId, name)` -- inserts a new subcategory under a category
- `deleteSubcategory(id)` -- deletes a subcategory
- Validation using zod schema

## Settings Page Changes

Update the **Categories tab** in `src/pages/Settings.tsx`:
- Change the flat category chip layout to an expandable/collapsible list
- Each category row shows its name, a delete button, and an "expand" toggle
- When expanded, show the subcategories under it as indented chips/items with delete buttons
- Add an inline "Add Subcategory" input field within each expanded category
- Add search filtering that also matches subcategory names

## Add Item Page Changes

Update `src/pages/AddItem.tsx`:
- Add an optional "Subcategory" dropdown that appears after selecting a category
- The subcategory dropdown is populated based on the selected category
- Subcategory is stored on the `inventory_items` table (requires adding a `subcategory` text column)

## Inventory Table Changes

Update `src/components/InventoryTable.tsx`:
- Display subcategory alongside category where applicable (e.g., "Electronics > Cables")

## Technical Details

### Migration SQL
```sql
-- Add subcategory column to inventory_items
ALTER TABLE public.inventory_items
ADD COLUMN subcategory text DEFAULT NULL;

-- Create subcategories table
CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subcategories" ON public.subcategories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subcategories" ON public.subcategories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subcategories" ON public.subcategories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subcategories" ON public.subcategories FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org subcategories" ON public.subcategories FOR SELECT USING (users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Files to create
- `src/hooks/useSubcategories.ts`

### Files to modify
- `src/pages/Settings.tsx` -- expand Categories tab with subcategory management
- `src/pages/AddItem.tsx` -- add subcategory selector
- `src/components/InventoryTable.tsx` -- display subcategory
- `src/lib/validation.ts` -- add subcategory validation schema
- `src/types/inventory.ts` -- add subcategory to InventoryItem type
- `src/hooks/useInventory.ts` -- handle subcategory field in CRUD operations

