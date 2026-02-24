

## Add CSV Import Button to Items & Inventory Page

Add an "Import CSV" button to the Items page header (next to "Add Item"), reusing the same pattern as the Assembly CSV import but adapted for inventory items.

### What Changes

**1. New Component: `src/components/ItemCsvImport.tsx`**
- Clone the pattern from `AssemblyCsvImport.tsx` (file input, preview dialog, confirm flow)
- CSV format: two columns -- **Name** (col 1) and **Description** (col 2), same as the assembly CSV
- Uses the same robust `parseCSVRows` parser that handles multi-line quoted fields
- On confirm, calls `addItem` for each row with sensible defaults for required fields (quantity: 0, price: 0, cost: 0, category: "Other", sku: "", etc.)
- Shows preview dialog with parsed name/description before importing
- Props: `onComplete` callback (to refresh item list) and `addItem` function

**2. Update `src/pages/Items.tsx`**
- Add `addItem` to the `ItemsProps` interface
- Import and render `ItemCsvImport` in the header, to the left of the "Add Item" button
- Pass `addItem` and a no-op `onComplete` (items auto-update via state)

**3. Update `src/App.tsx`**
- Pass `addItem` as a prop to the `<Items>` component (line ~102)

### Technical Details

- Each imported item will be created with default values for all required fields (0 quantity, 0 price, empty dimensions, etc.) since the CSV only provides name and description
- The same character-by-character CSV parser handles multi-line quoted descriptions correctly
- Items will sync offline just like manually added items since they use the existing `addItem` function

