

## Fix: Wrong Route Path for Item Name Links

### Problem
The item detail page route in `App.tsx` is defined as `/item/:id`, but the Link in the Job Items table points to `/items/${item.inventoryItemId}` (with an "s"). This causes a 404.

### Fix in `src/pages/Jobs.tsx`

Change the Link `to` prop from `/items/...` to `/item/...`:

```tsx
// Current (broken - wrong route)
<Link to={`/items/${item.inventoryItemId}`} ...>

// Fixed
<Link to={`/item/${item.inventoryItemId}`} ...>
```

One-line change -- just remove the "s" from "items" in the link path.
