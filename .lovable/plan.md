## Add "View Job Pricing" permission

Follow the existing feature-permission pattern (same as `view_all_requests`, `view_all_workers`, `parts_prefer_dxf`) stored in the `user_feature_permissions` table.

### New feature key
`view_job_pricing` — when granted (or user is admin/org admin), pricing is visible on Jobs. Otherwise all price/total UI on Jobs pages is hidden.

### Settings UI
In `src/components/UsersSettings.tsx`, under the **Jobs** page card, add an extra checkbox:
- Label: "View Job Pricing"
- Description: "See unit prices and totals on jobs."

Saving uses the same insert/delete flow already used for the other feature keys.

### Where pricing gets gated
Use `useFeaturePermissions().hasFeature('view_job_pricing')` plus `useIsAdmin` / `useIsOrgAdmin` to compute `canViewJobPricing`. When false, hide:

1. `src/pages/Jobs.tsx` (job detail panel)
   - "Total Value" summary line (around line 566)
   - Per-category total (`catTotal`, ~line 768)
   - "Unit Price" / line-total columns in the items table
2. `src/pages/AllJobItems.tsx`
   - Subtotal (line 157), "Unit Price" column header and cells, category cost rollup (`catCost`)
3. `src/pages/JobAddItems.tsx`
   - "Price" column in the inventory picker table

No schema changes required (table + RLS already exist). No changes to data fetching or job logic — purely a conditional render gate.

### Out of scope
- Quotes, Sales, Purchase Orders pricing (unchanged)
- PDF/invoice generation (unchanged)
- Editing prices (already controlled by page access)
