

## Add Tags System for Inventory Items

### What it does
Adds a tagging system where each inventory item can have multiple tags assigned to it. Tags are organized into **tag categories** (e.g., "Parts", "Tags") that you create and manage in Settings. You can then assign tags to items when creating or editing them, and tags will display on the item detail page and inventory table.

### Database Changes

**1. New `tag_categories` table**
Stores the tag category groupings (e.g., "Parts", "Tags").

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Category name |
| user_id | uuid | Owner |
| created_at | timestamp | Auto |

**2. New `tags` table**
Stores individual tags, each belonging to a tag category.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | Tag name |
| tag_category_id | uuid | FK to tag_categories |
| user_id | uuid | Owner |
| created_at | timestamp | Auto |

**3. New `item_tags` junction table**
Links tags to inventory items (many-to-many).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| item_id | uuid | FK to inventory_items |
| tag_id | uuid | FK to tags |
| user_id | uuid | Owner |
| created_at | timestamp | Auto |

All three tables will have RLS policies matching the existing pattern (user owns their data, org members can view).

Two default tag categories ("Parts" and "Tags") will be seeded when you first load the settings page.

### UI Changes

**4. Settings page -- new "Tags" tab**
- Add a new tab in Settings for managing tag categories and their tags
- Create/delete tag categories
- Create/delete tags within each category
- Searchable list of tag categories, each expandable to show its tags

**5. Add/Edit Item page -- tag selector**
- New "Tags" card section on the item form
- Shows tags grouped by their category
- Multi-select checkboxes or badge-style toggles to assign/remove tags
- Selected tags displayed as badges

**6. Item Details page -- display tags**
- Show assigned tags as badges grouped by category in the item detail view

**7. Inventory Table -- show tags**
- Display assigned tags as small badges next to the item name or in a dedicated column

**8. Items list -- filter by tag**
- Add tag filtering alongside the existing category filter in SearchFilter

### New Files
- `src/hooks/useTagCategories.ts` -- hook for tag categories CRUD
- `src/hooks/useTags.ts` -- hook for tags CRUD
- `src/hooks/useItemTags.ts` -- hook for managing tags on items

### Modified Files
- `src/pages/Settings.tsx` -- add Tags tab
- `src/pages/AddItem.tsx` -- add tag selector section
- `src/pages/ItemDetails.tsx` -- display tags
- `src/components/InventoryTable.tsx` -- show tags column
- `src/components/SearchFilter.tsx` -- add tag filter
- `src/pages/Items.tsx` -- wire tag filter

### Technical Details

- RLS policies follow the existing pattern: users can CRUD their own data, org members get SELECT via `users_share_org()`
- Tag categories and tags use `user_id` for ownership, same as categories/vendors
- The `useTagCategories` hook will auto-seed "Parts" and "Tags" categories on first load (similar to `useCategories` seeding defaults)
- Item tags are fetched in bulk for the inventory table using a single query with joins to avoid N+1 queries

