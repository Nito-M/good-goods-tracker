

## Plan: Improve Item Quantity Input in Invoice Picker

### Changes

#### 1. `src/components/FullScreenItemPicker.tsx` — Remove +/- buttons, improve input
- Remove the `Minus` and `Plus` buttons flanking the quantity input in the cart panel (lines 365-391)
- Widen the quantity input from `w-16` to `w-24` so all digits are visible
- Allow the input to hold an empty string (already supports `null` via `PickerCartItem.quantity`)

#### 2. `src/pages/Sales.tsx` — Don't remove item when quantity is 0 or empty
- Change `updateCartQuantity` to accept `number | null`
- Remove the `if (quantity <= 0) { remove }` logic — only remove via the explicit trash button
- Update the `onUpdateQuantity` callback passed to `FullScreenItemPicker` to pass `null` through instead of coercing to `0`

### Result
- No `+`/`-` buttons in the cart panel — just a clean, wider number input
- User can clear the field to type a new number without the item disappearing
- Items are only removed via the trash icon

