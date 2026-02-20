
# Fix: Square Feet Measurement Summary

## Root Cause

There are two problems with the Measurement Summary:

1. **Layout order bug** — The Measurement Summary card is rendered between the "Inventory & Pricing" card and the "Physical Properties" (dimensions) card. This means users see the summary before entering dimensions, and the card appears disconnected from the dimensions fields it depends on. React state is still correct, but the UX is broken — changes to dimensions are hard to correlate with the summary above.

2. **Missing `ft` dimension unit** — The dimension unit selector only shows `in` and `cm`. There is no `ft` option in the dimensions, which means someone working in feet has no way to get correct sq ft calculations. The fallback `else sheetSqFt = l * w` exists in code but is unreachable.

## What Will Be Fixed

### 1. Move the Measurement Summary after Dimensions
The summary card will be relocated to appear immediately **after the Physical Properties card** (which contains the dimensions inputs). This way:
- Users see the summary update as they fill in dimensions
- The visual connection between dimensions and sq ft summary is clear

### 2. Add `ft` as a dimension unit option
Add feet (`ft`) as a selectable dimension unit in the Dimensions selector. This enables:
- Entering sheet dimensions in feet (e.g. 4 ft × 8 ft)
- Correct sq ft calculation: `4 × 8 = 32 sq ft/sheet`

The conversion logic already handles `ft` correctly (the `else` branch uses `l * w` directly, which is correct for feet → sq ft).

### 3. Clarify the `sqft` quantity model with a helper label
Add a small helper text under the Quantity field when `sqft` is selected to make it clear:
- *"Enter the total sq ft in stock (e.g. 2000 sq ft). Add sheet dimensions below to calculate number of sheets."*

## Technical Changes

**File: `src/pages/AddItem.tsx`**
- Move the entire Measurement Summary IIFE block (lines 520–592) to be placed after the Physical Properties card (currently ends at line 673), so it renders after the dimensions inputs
- In the Dimensions unit selector `SelectContent`, add `<SelectItem value="ft">ft</SelectItem>` between the `in` and `cm` options
- Update the dimension unit type in `setDimensions` call to accept `'in' | 'cm' | 'ft'`
- Add a conditional helper hint beneath the quantity input when `quantityUnit === 'sqft'`

**File: `src/types/inventory.ts`**
- Update the `Dimensions` interface's `unit` field type from `'in' | 'cm'` to `'in' | 'cm' | 'ft'`

**File: `src/lib/validation.ts`**  
- Update the Zod schema for `dimensions.unit` to include `'ft'` as a valid enum value

No database changes are needed.
