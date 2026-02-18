
## Trailer Assemblies Page

### What This Feature Does

A new top-level section called **Trailer Assemblies** will be added to the sidebar. Users can:
- Create named assemblies (e.g. "16ft Flatbed Trailer", "Dump Trailer Kit")
- Add inventory items to each assembly with quantities
- View the full parts list per assembly

Think of it like a "bill of materials" — a template that lists which items and how many of each are needed to build a specific trailer type.

---

### How It Works

An **assembly** is a named template. Each assembly has **assembly items** — references to inventory items with a quantity. This is completely separate from Jobs; assemblies are reusable templates, not one-off work orders.

---

### Database Changes

Two new tables will be created:

**`assemblies`** — stores each named assembly
- `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`

**`assembly_items`** — stores items within each assembly
- `id`, `assembly_id`, `inventory_item_id` (nullable for custom items), `item_name`, `sku`, `quantity`, `notes`, `created_at`

RLS policies will mirror the existing pattern: users can CRUD their own records, and org members can view org records.

---

### Files to Create / Modify

**New Files:**
- `src/hooks/useAssemblies.ts` — data hooks for assemblies and assembly items (fetch, create, update, delete)
- `src/pages/Assemblies.tsx` — the main page with a two-panel layout:
  - Left panel: list of assemblies with a create button
  - Right panel: items in the selected assembly with add/remove/edit capability, and a searchable item picker

**Modified Files:**
- `src/components/AppSidebar.tsx` — add "Trailer Assemblies" as a new top-level nav item with a `Layers` icon
- `src/App.tsx` — add a route `/assemblies` pointing to `<Assemblies />`
- `src/hooks/usePagePermissions.ts` — register `assemblies` page key with its route
- `src/components/UsersSettings.tsx` — add `assemblies` to the `PAGE_KEYS` list so admins can toggle permission

---

### UI Layout

The Assemblies page follows the same two-panel master/detail pattern as the Jobs page:

```text
+-----------------------------+------------------------------------------+
| Assemblies                  | [Selected Assembly Name]                 |
|                             |                                          |
| [+ New Assembly]  [Search]  | Description...                           |
|                             |                                          |
| > 16ft Flatbed Trailer      | [+ Add Item]  (searchable combobox)      |
|   Dump Trailer Kit          |                                          |
|   Gooseneck Standard        | Item Name       SKU    Qty   [Remove]    |
|                             | Axle Hub 5-bolt  AH-01   2              |
|                             | Coupler 2-5/16   CP-02   1              |
+-----------------------------+------------------------------------------+
```

Items are added with the same searchable combobox pattern already used in the PO page (Popover + Command + CommandInput), so the UX is consistent.

---

### Technical Notes

- No migration needed for `assemblies` — a new migration SQL file will be created
- The `assembly_items.inventory_item_id` is nullable to allow custom (non-inventory) items, matching the pattern used in `job_items`
- The item search combobox reuses the same Popover/Command pattern added to `AddPurchaseOrderDialog.tsx` — consistent UX, no new dependencies
- The page key `'assemblies'` integrates into the existing permission system, so admins can restrict access per-user if needed
