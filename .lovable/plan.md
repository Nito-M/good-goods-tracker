

## Allow Full-Page Access for All Requests + Add Vendor Pricing Sub-Items

### Overview
Two changes: (1) make every request card clickable to open the full-page detail view (not just multi-item groups), and (2) add a "sub-items" system to the request detail page where users can add vendor pricing alternatives for each item (e.g., different vendors offering different prices for the same requested item).

### 1. Make All Request Cards Navigate to Detail Page

Currently only multi-item grouped request numbers are clickable. Change all cards (single and multi-item) so clicking them opens the full-page `RequestDetail` view.

**File: `src/pages/Requests.tsx`**
- Make the entire card clickable with `onClick={() => navigate(...)}`
- For single-item requests, navigate using their `requestNumber` (same route as grouped)
- Add `cursor-pointer hover:border-primary/40` styling to all cards

### 2. Create `request_sub_items` Database Table

A new table to store vendor pricing alternatives per request item.

```text
request_sub_items
-----------------
id              uuid (PK, default gen_random_uuid())
request_id      uuid (FK -> requests.id ON DELETE CASCADE)
user_id         uuid (NOT NULL)
vendor_name     text (NOT NULL)
unit_price      numeric (default 0)
link            text (nullable)
notes           text (nullable)
is_selected     boolean (default false)
created_at      timestamptz (default now())
```

RLS policies: same org-based pattern as requests (owner CRUD + org members can view/update).

### 3. Create `useRequestSubItems` Hook

**File: `src/hooks/useRequestSubItems.ts`** (new)
- Fetch sub-items for a given list of request IDs
- CRUD operations: `addSubItem`, `updateSubItem`, `deleteSubItem`, `toggleSelected`
- Follow the same pattern as other hooks in the project

### 4. Update Request Detail Page with Sub-Items UI

**File: `src/pages/RequestDetail.tsx`**
- Below each item row in the table, add an expandable section showing vendor pricing alternatives
- Each sub-item row shows: vendor name, unit price, link, notes, and a "select" toggle
- Add an "Add Option" button per item to create a new sub-item
- Inline form for adding: vendor name (required), unit price, link, notes
- The selected sub-item (if any) is highlighted with a subtle accent background

### 5. Update TypeScript Types

**File: `src/types/request.ts`**
- Add `RequestSubItem` interface with fields matching the table

### Technical Details

- The sub-items table uses `request_id` as a foreign key with `ON DELETE CASCADE` so deleting a request cleans up its alternatives
- The `is_selected` boolean lets users mark their preferred vendor option
- The detail page uses a collapsible (`Collapsible` component) per item row to show/hide sub-items
- No changes needed to the requests table itself -- sub-items are a separate related table
- The sub-items are only visible/manageable on the full-page detail view, keeping the card view clean

### Files to Create/Modify
- **Migration**: Create `request_sub_items` table with RLS
- **Create** `src/hooks/useRequestSubItems.ts`
- **Modify** `src/types/request.ts` -- add `RequestSubItem` interface
- **Modify** `src/pages/Requests.tsx` -- make all cards clickable to detail page
- **Modify** `src/pages/RequestDetail.tsx` -- add sub-items UI per item row
