## Goal
On the Sales Order **Jobs** tab, hide each item's long description (`item.notes`) by default and let the user expand it per row. The add-on count already shows next to the title — keep it there.

## Changes (single file: `src/pages/SalesOrderDetail.tsx`)

1. **New state** next to `collapsedParents`:
   ```ts
   const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
   ```
   (Default = empty → all descriptions collapsed.)

2. **Row title area** (around lines 689–699): when `item.notes` exists, render a small chevron button right after the item name + add-on count. Clicking it toggles `item.linkKey` in `expandedNotes`.
   - Collapsed (default): chevron-right icon, notes hidden.
   - Expanded: chevron-down icon, notes shown below as today.

3. Add-on count stays as-is — `(N add-ons)` rendered inline after the title.

4. Child rows (`isChild`) get the same treatment so attached add-on notes also collapse.

## Behavior
- No layout shift when there are no notes (button only renders if `item.notes` is set).
- State is local to the component; collapses reset on page reload (matches existing `collapsedParents` pattern).
- No backend or data changes.
