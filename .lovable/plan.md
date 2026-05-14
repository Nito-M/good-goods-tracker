## Sales page: history-first + New Sale button

### Changes to `src/pages/Sales.tsx`

1. **Default landing tab** — change initial `activeTab` state from `'new-sale'` to `'history'` so opening `/sales` shows the invoice history list immediately.

2. **Replace the logout button in the header** (currently top-right of the Sales header, next to the "Next: INV-XXXX" badge) with a primary **New Sale** button:
   - Icon: `Plus` (already imported)
   - Label: "New Sale"
   - On click: `setActiveTab('new-sale')` and call existing `resetForm()` so the picker opens with a clean cart
   - Remove the `LogOut` icon import and the `signOut` destructure from `useAuth()` on this page (logout remains available in the sidebar).

3. **Keep everything else identical** — the `new-sale` tab content, `FullScreenItemPicker`, cart, markup, vendor selector, invoice number, and sale-creation flow are unchanged. Tab navigation between history and new sale still works the same way; only the default landing view and header action change.

### Out of scope
- No changes to data, hooks, item picker, PDF generation, or routing.
- Sidebar logout button is untouched.
