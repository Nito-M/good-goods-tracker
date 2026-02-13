

## Fix: Item Name Link Not Working in Job Items

### Root Cause
The collapsible category header is rendered as a `<button>` element (line 414). The item name link is also a `<button>` nested inside the table within this structure. While the table itself is outside the button element, let me verify the actual nesting more carefully -- the table is a sibling rendered conditionally after the button, so nesting isn't the issue.

The actual problem is likely that the `<button>` for the item name needs `e.stopPropagation()` to prevent the click from bubbling up and being caught by a parent handler, or there may be a CSS/pointer-events issue.

### Fix in `src/pages/Jobs.tsx`

**Change the item name from a `<button>` to a `<Link>` component from react-router-dom:**

Replace the current button-based approach (lines 457-463):
```tsx
// Current (broken)
<button onClick={() => navigate(`/items/${item.inventoryItemId}`)} className="hover:underline text-primary text-left">
  {item.itemName}
</button>

// Fixed - use Link component for proper navigation
<Link to={`/items/${item.inventoryItemId}`} className="hover:underline text-primary">
  {item.itemName}
</Link>
```

Using `<Link>` instead of a `<button>` with `navigate()` is the standard React Router pattern for navigation and will work reliably as an anchor element regardless of parent event handlers. The `Link` import from `react-router-dom` should already be available or will be added alongside the existing `useNavigate` import.

