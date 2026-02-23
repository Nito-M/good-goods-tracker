

# Inventory Warehouses / Locations

## Overview
Add a warehouse/location system so you can organize inventory across multiple physical locations. There will be an "All Inventory" default view (showing everything), plus the ability to create custom-named locations (e.g. "Main Warehouse", "Garage", "Shop Floor") and assign items to them.

## How It Works

1. A new "Warehouses" table stores user-defined locations with custom names
2. Each inventory item gets an optional `warehouse_id` linking it to a location
3. The Items page gets a warehouse filter dropdown -- "All Locations" shows everything, or pick a specific warehouse
4. A new Warehouses management page lets you create, rename, and delete locations
5. When adding/editing items, you can assign them to a warehouse

## Database Changes

### New `warehouses` table
- `id` (uuid, primary key)
- `user_id` (uuid, not null)
- `name` (text, not null) -- custom name like "Main Warehouse"
- `description` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- RLS policies: users can CRUD their own; org members can view

### Update `inventory_items` table
- Add `warehouse_id` (uuid, nullable, references warehouses) -- null means unassigned

## UI Changes

### 1. Warehouses management page (`src/pages/Warehouses.tsx`)
- List all warehouses with item count for each
- Add/rename/delete warehouses via dialogs
- Click a warehouse to filter the Items page to that location

### 2. Items page updates (`src/pages/Items.tsx`)
- Add a warehouse filter dropdown alongside existing category and tag filters
- "All Locations" option shows everything (default)
- Each specific warehouse filters to only items in that location

### 3. Add/Edit Item form updates (`src/pages/AddItem.tsx`)
- Add a "Location" dropdown to assign the item to a warehouse
- Optional -- leaving it blank means the item has no assigned location

### 4. Sidebar updates (`src/components/AppSidebar.tsx`)
- Add "Warehouses" nav item (with a Warehouse icon) in the navigation menu

### 5. New hook (`src/hooks/useWarehouses.ts`)
- CRUD operations for warehouses
- Fetch warehouse list for the current user

### 6. Inventory hook updates (`src/hooks/useInventory.ts`)
- Add `warehouseFilter` state
- Include `warehouse_id` in item fetch/create/update logic

## Technical Details

### New files
- `src/pages/Warehouses.tsx` -- warehouse management page
- `src/hooks/useWarehouses.ts` -- warehouse CRUD hook
- Database migration for `warehouses` table and `inventory_items.warehouse_id` column

### Modified files
- `src/pages/Items.tsx` -- add warehouse filter dropdown
- `src/pages/AddItem.tsx` -- add warehouse selector to form
- `src/hooks/useInventory.ts` -- handle warehouse_id in DB operations
- `src/types/inventory.ts` -- add warehouseId to InventoryItem interface
- `src/components/AppSidebar.tsx` -- add Warehouses nav link
- `src/App.tsx` -- add /warehouses route
- `src/components/SearchFilter.tsx` -- add warehouse filter option

