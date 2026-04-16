

## Current state (confirmed via DB)

- `inventory_items` has NO `organization_id` column. Items are owned by `user_id`.
- RLS shares items across **all** members of any shared org via `users_share_org`. Result: a user in both FM and Ironclad sees one merged pool — there is no real per-org inventory today.
- DB shows: FM = 806 items (all created by 2 FM users), Northern Outline = 9 items, **Ironclad = 0 items** (its 2 members have never created an item). That's why Ironclad is empty.
- Items page (`src/pages/Items.tsx`) doesn't filter by org at all.

## What you actually want

1. Each org has its OWN inventory list (FM items separate from Ironclad items separate from Northern Outline items).
2. On the Items page, see one org at a time (switch via tabs).
3. Drag an item from one org's list and drop it onto another org's tab → the item is **copied** into that org (originals stay put).

## Plan

### 1. Database (migration)
- Add `organization_id uuid` (nullable) to `inventory_items` with FK to `organizations(id)`.
- Add index on `(organization_id, deleted_at)`.
- **Backfill**: for every existing item, set `organization_id` = the first org its `user_id` belongs to. (FM users → FM, Ironclad users → Ironclad, etc.) This preserves all current data per-org correctly.
- Update RLS so members only see items where `organization_id` is one of their orgs (replace the loose `users_share_org(...)` SELECT policy). Keep insert/update/delete tied to org membership via a `is_org_member(auth.uid(), organization_id)` check.

### 2. Items page — org tabs
- Add a tab row at the top of `src/pages/Items.tsx`: one tab per org the user belongs to (e.g. `FM Fabrications | Ironclad Trailers | Northern Outline`).
- Selected tab is stored in URL (`?org=<id>`) and persisted to localStorage.
- `useInventory` gets an `activeOrgId` parameter and filters the query: `.eq('organization_id', activeOrgId)`.
- New items created on the Items page are stamped with the active org's id.

### 3. Drag-and-drop between orgs (copy)
- Each row in `InventoryTable` becomes `draggable`, carrying the item id in the drag payload.
- Each org tab (other than the active one) becomes a drop target. On drop:
  - Confirm dialog: "Copy '<item name>' to <Target Org>?"
  - On confirm: insert a duplicate row with the same fields but `organization_id = targetOrgId` and a fresh `id`. (Quantity copies as-is; warehouse/location links are NOT copied since those belong to the source org.)
  - Toast: "Copied to <Target Org>".
- Copy only — no Move (matches your "grab from FM and drop into Ironclad" framing where both orgs may need the same product).

### 4. Add Item flow
- `AddItem` page reads the active org from URL/localStorage and stamps `organization_id` on insert.
- CSV import (`ItemCsvImport`) does the same.

### 5. Touchpoints to also stamp/migrate (low risk, same pattern)
- `useInventory.addItem`, `useInventory.updateItem` → include/preserve `organization_id`.
- Storefront edge function (`public-storefront`) → already keyed off org slug, no change needed beyond the new column being present.

## Out of scope (for now)
- Per-org warehouses/locations, vendors, categories — these stay shared. We can split them later if you want.
- "Move" semantics — copy only.
- Cross-org references in jobs/POs/sales — items remain referenceable by id regardless of org.

## Files that will change
- New migration: add column, backfill, new RLS policies.
- `src/hooks/useInventory.ts` — accept `activeOrgId`, scope queries, stamp inserts, add `copyItemToOrg(itemId, targetOrgId)`.
- `src/pages/Items.tsx` — org tab bar, drop targets, drag wiring, pass `activeOrgId` to `useInventory`.
- `src/components/InventoryTable.tsx` — make rows draggable.
- `src/pages/AddItem.tsx` and `src/components/ItemCsvImport.tsx` — stamp `organization_id` on creation.
- New small hook `useUserOrganizations` — returns the orgs the current user belongs to (for the tab bar).

## Heads-up
After this migration Ironclad will still show 0 items (because none were ever created by an Ironclad member). To populate it, drag items from FM into the Ironclad tab — that's exactly the workflow you described.

