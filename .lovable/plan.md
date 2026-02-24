

# Merge Locations into Items Page

## What Changes

The separate **Locations** (`/warehouses`) page will be removed. Instead, when you navigate to **Items**, you'll first see a row of location buttons (including "All") at the top. Selecting a location filters the items shown below. You can also manage locations (add/edit/delete) right from the Items page.

## How It Will Work

1. At the top of the Items page, below the header, a horizontal row of clickable location chips/buttons appears:
   - **All** (selected by default) -- shows every item
   - One button per location (e.g. "Main Warehouse", "Shop Floor")
   - A **+ Add Location** button at the end (with edit/delete options on each location)

2. Clicking a location filters items to only those assigned to that location (using the existing `warehouse` URL parameter)

3. The existing warehouse filter dropdown in `SearchFilter` will be removed since location selection is now the primary UI

4. The `/warehouses` route and sidebar link will be removed

---

## Technical Details

### 1. Update `Items` page (`src/pages/Items.tsx`)
- Import `useWarehouses` hook
- Add a location selector bar above the search/filter area with "All" + each warehouse as a button
- Include inline add/edit/delete location functionality (reuse the dialog pattern from the current `Warehouses.tsx`)
- Remove the `warehouseFilter` / `warehouseOptions` props from `SearchFilter` since location is selected above
- Filter items by `warehouseId` matching the selected location (or show all)

### 2. Remove `Warehouses` page
- Delete `src/pages/Warehouses.tsx` (or leave unused)
- Remove the `/warehouses` route from `src/App.tsx`
- Remove the "Locations" sidebar entry from `src/components/AppSidebar.tsx`

### 3. Update `SearchFilter` component (`src/components/SearchFilter.tsx`)
- Remove the warehouse filter dropdown props (they become optional/removed) since location is handled at a higher level in the Items page

### 4. No database changes needed
- The `warehouses` table and `item_location_quantities` table remain unchanged
- Filtering uses the existing `warehouseId` field on inventory items

