
Goal: Make the item picker in “Create New Request” scroll independently so users can browse long inventory lists.

What I found in the code
- The create-request form is in `src/components/AddRequestDialog.tsx`.
- The item picker uses a Popover + Command list:
  - `PopoverContent` at the item selector block.
  - `CommandList` for inventory rows.
- Base `CommandList` already has `max-h-[300px] overflow-y-auto` in `src/components/ui/command.tsx`, but inside a scrollable dialog (`DialogContent` uses `overflow-y-auto`) wheel/touch scroll can still bubble and feel like the dropdown is not scrolling.
- The current `PopoverContent` width is set with inline style and `w-full`; I’ll switch this to the same stable pattern used elsewhere in your app (`w-[--radix-popover-trigger-width]`) for consistency.

Implementation plan
1. Update only the request-creation item dropdown container
   - File: `src/components/AddRequestDialog.tsx`
   - In the item selection Popover:
     - Change `PopoverContent` class to:
       - fixed trigger width (`w-[--radix-popover-trigger-width]`)
       - `p-0`
       - explicit solid background and strong stacking context (`bg-popover`, higher `z-index`) to avoid any overlay/pointer oddities.
   - Keep alignment as `start`.

2. Force the dropdown list itself to own scrolling
   - File: `src/components/AddRequestDialog.tsx`
   - On the `CommandList` used for items:
     - Add explicit classes such as:
       - `max-h-[min(50vh,20rem)]`
       - `overflow-y-auto`
       - `overscroll-contain`
     - Add wheel/touch propagation guards (stop propagation) so dialog/page scrolling does not steal the scroll gesture while pointer is over the item list.

3. Keep behavior unchanged for selection/search
   - Preserve existing search/filter behavior and `onSelect` handlers.
   - No data, backend, or permissions changes required.

Why this approach
- It targets the exact control the user reported (Create Request item dropdown) without risking side effects to every combobox globally.
- It addresses the two common failure points in nested scroll UIs:
  - weak scroll ownership (list not clearly constrained),
  - event bubbling to parent scroll containers.

Validation checklist (end-to-end)
1. Open Requests → New Request.
2. Open Item dropdown with many inventory items.
3. Scroll with mouse wheel/trackpad/touch inside dropdown:
   - Item list should move.
   - Dialog body should not move while pointer is over list.
4. Type in search and verify filtered results still scroll.
5. Select an item near bottom of list and confirm it fills name/SKU correctly.

Technical notes
- Planned files to modify:
  - `src/components/AddRequestDialog.tsx` (only)
- No database, schema, auth, or backend function changes.
- If you want this same fix applied app-wide after this, I can follow up by hardening `src/components/ui/command.tsx` globally in a separate pass.
