
# Move Category into Subcategory

## What this does
Adds a "Move to Subcategory" action on the Settings > Categories tab. When you choose to move a category, you pick a parent category to move it under. All items currently assigned to that category will be updated so their category becomes the new parent and their subcategory becomes the old category name. The old category is then removed.

## How it works (user flow)
1. On the Categories settings tab, each category row gets a new "Move" button (arrow icon)
2. Clicking it opens a dialog asking "Which category should this become a subcategory of?"
3. You pick the target parent category from a dropdown
4. Clicking "Move" will:
   - Create a new subcategory under the target parent with the old category's name
   - Update all inventory items that had the old category: set their `category` to the parent's name and `subcategory` to the old category's name
   - Delete the old category record

## Technical details

### File: `src/hooks/useCategories.ts`
- Add a `moveCategoryToSubcategory(categoryId, targetParentCategoryId)` function that:
  1. Looks up both category names
  2. Inserts a new subcategory record under the target parent (via the subcategories table)
  3. Updates all `inventory_items` where `category = oldCategoryName`, setting `category = parentName` and `subcategory = oldCategoryName`
  4. Deletes the old category record
  5. Refetches categories and subcategories

### File: `src/pages/Settings.tsx`
- Add a "Move to Subcategory" button on each category row
- Add a dialog with a dropdown to pick the target parent category (excluding itself)
- Wire it to the `moveCategoryToSubcategory` function
- After completion, refresh the category list

No database schema changes are needed -- this uses existing tables and columns (`categories`, `subcategories`, `inventory_items.category`, `inventory_items.subcategory`).
