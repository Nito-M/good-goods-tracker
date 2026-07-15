## Fix flash of restricted content on Item Details

**Problem:** When a user with `items_quantity_only` opens an item, the full details page briefly renders before the feature permission loads, then swaps to the restricted view.

**Cause:** `useFeaturePermissions()` starts with `features = []` and `loading = true`. `ItemDetails.tsx` checks `quantityOnly = hasFeature('items_quantity_only')` which is `false` until the fetch resolves, so the full page renders first.

**Fix:** In `src/pages/ItemDetails.tsx`, also read `loading` from `useFeaturePermissions()` and show a lightweight loader (matching the existing item-loading skeleton) until it resolves. Only after `loading === false` do we branch to the quantity-only view or the full details view. This guarantees the restricted layout is the first thing painted for gated users, with no cost to unrestricted users beyond one render tick they were already waiting through.

No schema or business-logic changes.