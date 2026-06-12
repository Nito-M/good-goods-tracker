# Inventory Price Display Toggle

Add a per-user preference that controls whether the Items & Inventory page shows each item's **Selling price** or **Cost price** in the price column. Configured from a new **Inventory Settings** page.

## What you'll see

- On the Items & Inventory page header, next to the existing action buttons, a new **Settings** (gear icon) button.
- Clicking it opens a new full page: **Inventory Settings**.
- First setting on that page: **Price column shows** — two choices, *Selling price* (default) or *Cost price*.
- Saving flips the price column on the Items & Inventory page (and the inventory table everywhere it's used) for that user, on every device.
- The page is built so more inventory-wide preferences can be added later (default sort, low-stock threshold display, etc.).

## Technical notes

- **DB**: add columns to `profiles`:
  - `inventory_price_display text not null default 'selling'` (check in `'selling','cost'`)
- **Hook**: `useInventoryPreferences()` — reads/writes the profile row, exposes `{ priceDisplay, setPriceDisplay }`. Cached via React Query.
- **UI changes**:
  - `src/pages/Items.tsx` — add gear button → navigates to `/inventory-settings`.
  - `src/components/InventoryTable.tsx` — read `priceDisplay`; render `item.cost` instead of `item.price` when set to `'cost'`. Header label switches between "Price" and "Cost".
  - New page `src/pages/InventorySettings.tsx` — back button, single RadioGroup card for now, saves on change.
  - Route added in `src/App.tsx`.
- No business-logic changes; sales/quotes/POs still use the real `price`/`cost` fields as today. This is presentation only.
