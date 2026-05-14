## Item column display change

Update `src/components/board/cells/ItemCell.tsx` so that when an item is linked, the cell shows **only the live price** (e.g. `$12.50`) instead of the icon + name + sku + price layout.

### Behavior

- **Linked + price available** → show only the formatted price, right-aligned by default (respects column/cell `align` prop).
- **Linked + no price yet** (inventory/parts still loading, or item has no price) → show a subtle `—` placeholder so the cell isn't empty.
- **Not linked** → unchanged: shows the "Link item…" hint with the link icon.
- **Hover tooltip** → on hover, show a tooltip with the linked item's name, SKU (if any), and a small icon indicating Inventory vs Part. Uses the existing shadcn `Tooltip` component for consistency with the rest of the app.
- Clicking the cell still opens `BoardItemPickerDialog` to change/clear the link (unchanged).

### Technical details

- Wrap the linked-state button in `<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip>`.
- Drop the inline name/sku spans from the visible cell content; keep the `Package`/`Wrench` icon only inside the tooltip (not in the cell).
- Continue using the `livePrice` prop already passed in (no changes to `BoardDetail.tsx` wiring needed beyond confirming `livePrice` is forwarded — currently the `case 'item'` render does **not** pass `livePrice`, so I'll add `livePrice={getItemLivePrice(rowId, colId)}` to that render call).
- No DB or hook changes.

### Files touched

- `src/components/board/cells/ItemCell.tsx` — render only price + tooltip with item info.
- `src/pages/BoardDetail.tsx` — pass `livePrice` into `<ItemCell>` (one-line addition in the `case 'item'` branch).