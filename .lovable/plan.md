
# Fix: Square Feet Quantity Model - Flip to Sheet-Count Input

## The Real Problem

The core issue is a **model mismatch** between what the app does and what users expect:

Current (broken UX):
- User enters `quantity = 100` and expects that to mean "100 sheets"
- App treats `quantity = 100` as "100 sq ft total"
- With a 12 × 12 in sheet (1 sq ft/sheet), app shows "100 sheets" — which coincidentally appears correct for that specific case, but breaks for any other sheet size

Real-world expectation:
- User has 50 sheets of 4 ft × 8 ft plywood
- User enters `quantity = 50` (sheets) and selects unit `Sq Ft`
- App should show: "50 sheets × 32 sq ft/sheet = 1,600 sq ft total"

Current behavior:
- User enters `quantity = 50`, app treats it as 50 sq ft total → shows "1.56 sheets" (50 ÷ 32) — **wrong**

Additionally, there is a secondary bug in `useInventory.ts` line 58 where `dimensions_unit` is cast to `'in' | 'cm'` (missing `'ft'`), which can silently break calculations when `ft` is saved to the database.

## What Will Be Fixed

### 1. Flip the quantity model for `sqft` items
- `quantity` = **number of sheets** (intuitive)
- App calculates **total sq ft = quantity × sheet area** (derived, shown in summary)
- This is what every user naturally expects

### 2. Fix the type cast bug in `useInventory.ts`
- Line 58: change `as 'in' | 'cm'` to `as 'in' | 'cm' | 'ft'` so feet dimension unit is preserved correctly when fetched from the database

### 3. Update labels and helper text
- Quantity label hint changes from "Enter total sq ft in stock" to "Enter number of sheets in stock"
- Measurement Summary shows: sheets → sq ft total
- Item Details page shows: "X sheets" as stock, "Y sq ft total" as derived metric

### 4. Update ItemDetails.tsx display
- "Quantity in Stock" shows sheets (e.g., "50 Sq Ft" label should say "50 sheets")
- Sheet calculation section shows total sq ft instead of deriving sheets from sq ft

## Technical Changes

**File: `src/hooks/useInventory.ts`**
- Line 58: Fix type cast from `as 'in' | 'cm'` to `as 'in' | 'cm' | 'ft'`

**File: `src/pages/AddItem.tsx`**
- Update helper text under quantity input when `sqft` is selected: "Enter the number of sheets in stock. Add sheet dimensions below to see total sq ft."
- Update Measurement Summary IIFE:
  - `sheetsInStock` → now just `qty` (quantity IS the sheet count)
  - `totalSqFt` → now `qty * sheetSqFt` (calculated from sheet count × sheet area)
  - Display: "X sheets in stock → Y sq ft total"

**File: `src/pages/ItemDetails.tsx`**
- Update the sqft section (lines 294–323):
  - Show quantity as "X sheets" 
  - Compute and display total sq ft = `quantity × sheetSqFt`
  - Show "Total Sq Ft in Stock" as the derived value

No database schema changes needed — the `quantity` column already stores a number; we're only changing the interpretation and display logic.
