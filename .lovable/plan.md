## Goal
In the Job details page → Parts tab, show items grouped by **Category → Subcategory** (nested), instead of the current flat category grouping.

## Changes

**1. `src/hooks/useJobs.ts` — `useJobItems`**
- Extend the Supabase select to also fetch `subcategory` from the joined inventory item: `inventory_items(category, subcategory)`.
- Map `subcategory: d.inventory_items?.subcategory ?? null` onto each item.

**2. `src/types/job.ts`**
- Add `subcategory: string | null` to the `JobItem` interface.

**3. `src/pages/Jobs.tsx` (JobDetail component, Parts tab)**
- Replace the current `groupedItems` (flat `category → items[]`) with a nested structure: `category → { subcategory → items[] }`. Items with no subcategory go under a "— No subcategory —" bucket.
- Render each category as the existing collapsible card (unchanged header: name, count, total). Inside, render each subcategory as a lighter collapsible sub-section (chevron, name, item count, and subcategory total if pricing is visible). The existing items `Table` renders inside each subcategory group.
- Extend `collapsedCategories` handling to also track collapsed subcategories using composite keys like `"${category}::${subcategory}"` so state doesn't collide.
- Sort categories alphabetically (as today); sort subcategories alphabetically with the "No subcategory" bucket last.

## Out of scope
- No change to All Job Items page, Jobs board grouping, or the Add-Items flow.
- No schema changes — subcategory already exists on `inventory_items` and is joined at read time.
