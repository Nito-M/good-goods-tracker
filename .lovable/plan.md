

# Reorder Trailer Configurator: Make Step 2 "Under Carriage"

## Current Step Order
1. Select Trailer Type
2. Select Front End
3. Select Back End
4. Select Deck Type (Optional)
5. Select Under Carriage (Optional)
6. Summary

## New Step Order
1. Select Trailer Type
2. **Select Under Carriage** (moved up, multi-select)
3. Select Front End
4. Select Back End
5. Select Deck Type (Optional)
6. Summary

## Changes

**File: `src/pages/TrailerConfigurator.tsx`**
- Reorder the `STEPS` array so "Under Carriage" is index 1 (after Trailer Type)
- Move the Under Carriage selection UI block from step 4 to step 1
- Move Front End to step 2, Back End to step 3, Deck Type to step 4
- Update `canNext()` logic to match new step indices (under carriage is optional at step 1, front end required at step 2, back end required at step 3, deck optional at step 4)
- Update the summary lookup trigger from `step === 5` to remain at the last step (still index 5)

No database or hook changes needed — purely a UI reorder.

