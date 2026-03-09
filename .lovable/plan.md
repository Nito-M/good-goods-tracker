

## Change Parts Library from Card Grid to Line Items

Replace the current card-based grid layout for parts with a compact table/list layout showing each part as a single row.

### What changes

**`src/pages/PartsLibrary.tsx`**:

1. **Parts section** (currently a grid of cards with image previews): Replace with a table-style list where each part is a single row containing:
   - Small thumbnail (40x40px) or placeholder icon
   - Part name
   - SKU
   - Price
   - DXF badges
   - Actions dropdown (move, delete)
   - Checkbox in select mode

2. **Folders section**: Convert from card grid to compact list rows with folder icon, name, counts, and actions — keeping the same interaction behavior.

3. The table will use a `div`-based list (or the existing `Table` component) with hover highlights, maintaining all current functionality (click to navigate, select mode, context menus).

### Layout per part row
```text
[☐] [thumb] | Part Name        | SKU      | Price  | DXF tags | [⋮]
```

No database or hook changes needed — purely a UI restructure.

