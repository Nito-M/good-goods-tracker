## Change

In `src/components/SaleCard.tsx`, replace the inline Edit, Revert, and Delete buttons in the card header with a single `MoreVertical` (⋮) icon button that opens a `DropdownMenu`.

Keep as-is (still inline next to the dropdown):
- Picked Up checkbox
- Status selector
- Preview button
- Invoice (download) button

Dropdown contents:
1. **Edit** — calls `onEdit(sale)`
2. **Revert** — only if `sale.status !== 'cancelled'`; opens the existing `AlertDialog` confirm (Revert Sale?) before calling `onRevert`
3. **Delete** (destructive styling) — opens the existing `AlertDialog` confirm (Delete Sale?) before calling `onDelete`

## Technical notes

- Use existing `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` from `@/components/ui/dropdown-menu`.
- For the two `AlertDialog` confirms, control them with local `useState` (`revertOpen`, `deleteOpen`) and trigger them from `DropdownMenuItem` `onSelect` handlers (call `e.preventDefault()` so the menu closes cleanly, then open the dialog). This avoids nesting an `AlertDialogTrigger` inside a menu item.
- Wrap the trigger button and dialogs in the existing `onClick={stop}` container so card navigation isn't triggered.
- No behavior, props, or parent-component changes — `Sales.tsx` stays the same.

## Files

- `src/components/SaleCard.tsx`
