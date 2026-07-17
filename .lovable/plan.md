## Change

When a user is restricted to exactly one location, hide the **All** button on the Items page location bar and force the filter to that single location.

### Files

**`src/pages/Items.tsx`**
- Compute `singleLocationOnly = restrictedByPermission && warehouses.length === 1`.
- In the location selector bar (~line 307):
  - Render the **All** button only when `!singleLocationOnly`.
- Default the active filter to the one allowed warehouse when `singleLocationOnly` and the current `warehouseFilter` is `'all'` (set it via `setWarehouseFilter(warehouses[0].id)` in an effect), so the list isn't stuck on an "all" state that's no longer selectable.

No backend / permissions logic changes — this is purely UI gating driven by the existing `restrictedByPermission` flag from `useWarehouses`.