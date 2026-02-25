
Goal: fix the remaining transparency on the Jobs page when using a picture background by making table-related surfaces fully solid.

What I found
- The shared table primitive (`src/components/ui/table.tsx`) still renders the table wrapper with no explicit background, so on picture backgrounds the Jobs list table can look transparent.
- In `src/pages/Jobs.tsx`, there are still explicit semi-transparent classes in the Job Detail section:
  - Category row toggle: `bg-muted/50`
  - Fallback image cell tile: `bg-muted/50`
- The main Jobs list header row currently has no explicit header background class in this page (it relies on table defaults), so if defaults are transparent it appears see-through.

Implementation approach
1. Update shared table defaults so tables render on a solid surface
- File: `src/components/ui/table.tsx`
- Changes:
  - Add a solid table surface on the wrapper (`bg-card`) so all tables using this component are opaque over image backgrounds.
  - Add a default solid header background (`[&_tr]:bg-muted`) in `TableHeader` so headers are visibly solid by default.

2. Patch Jobs page-specific remaining translucent classes
- File: `src/pages/Jobs.tsx`
- Changes:
  - Change category accordion row from `bg-muted/50` to `bg-muted`.
  - Change placeholder thumbnail tile from `bg-muted/50` to `bg-muted`.
  - Ensure the Jobs list header row stays explicitly solid by adding `className="bg-muted hover:bg-muted"` to its header `TableRow` (defensive page-level clarity even with shared defaults).

Why this fixes your issue
- The table container itself becomes opaque (`bg-card`), so non-hovered table areas are no longer transparent.
- Header rows and category strip rows are solid (`bg-muted`), eliminating the last translucent table-like bands in Jobs UI.
- This preserves your existing theme system while removing unintended transparency in this workflow.

Validation checklist
- On `/jobs` with picture background enabled:
  - Jobs list table background is solid.
  - Jobs list header row is solid.
  - Hover states remain usable and readable.
- Open a job detail:
  - Category header strip is solid.
  - Empty thumbnail placeholder tile is solid.
- Verify in both dark and light custom-background modes.
- Quick regression pass on another table screen (e.g., Inventory) to confirm shared table update still looks correct.

Files to modify
- `src/components/ui/table.tsx`
- `src/pages/Jobs.tsx`
