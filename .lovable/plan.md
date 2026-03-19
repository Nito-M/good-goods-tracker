

## Plan: Deferred Quantity Input with Confirm Button

### Problem
Currently, every keystroke in the quantity field immediately triggers `onUpdateQuantity`, which saves to the database on each character typed. This makes it hard to enter multi-digit numbers.

### Solution
Add local state buffering to the quantity input in the cart panel. The quantity only commits when the user clicks a small checkmark button or presses Enter.

### Changes

**`src/components/FullScreenItemPicker.tsx`**

1. Extract the cart item row into a small internal component (e.g., `CartItemRow`) so each row can hold its own local quantity state.
2. Initialize local quantity from `c.quantity` on mount / when the prop changes externally (e.g., item first added).
3. Replace the direct `onUpdateQuantity` call in `onChange` with a local state setter.
4. Show a small checkmark (`Check` icon) button next to the quantity input that appears when the local value differs from the committed value. Clicking it calls `onUpdateQuantity`.
5. Also commit on `Enter` key press and on `blur` (losing focus).
6. Visual indicator: the checkmark button uses a green/primary color to signal "unsaved change."

### UI Result
```
[ 12    ] [✓]    $5.00 ea
                  $60.00
```
The ✓ button appears only when the quantity has been edited but not yet saved, keeping the UI clean otherwise.

