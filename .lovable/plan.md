

## Make Quotes a Subitem Under Sales

### What Changes
In the sidebar, "Quotes" will be removed as a standalone menu item and instead appear as a nested subitem under "Sales", using the same collapsible pattern that "Jobs" already uses.

### How It Works
- Remove `{ title: "Quotes", ... }` from the `menuItems` array
- Replace the simple "Sales" menu item with a collapsible section (like Jobs)
- The collapsible will have "Sales" as the parent link (`/sales`) and "Quotes" as a nested child link (`/quotes`)
- The collapsible auto-opens when the user is on `/sales` or `/quotes`
- Respects existing page permissions -- Sales section only shows if `sales` is allowed, Quotes subitem only shows if `quotes` is allowed

### File to Modify
- `src/components/AppSidebar.tsx`
  - Remove Quotes from `menuItems` array
  - Remove Sales from `menuItems` array (it becomes a custom collapsible block)
  - Add a new collapsible Sales section (between Items and Purchase Orders) with a "Quotes" subitem, following the same pattern as the Jobs collapsible
  - Add `salesOpen` state initialized from current path

