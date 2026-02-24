

## Mass CSV Upload for Multiple Assemblies

Add a CSV import button on the Assembly Types landing page that lets you upload a single CSV file to create multiple assemblies at once, each with their items pre-populated.

### How It Works

1. An "Import CSV" button appears on the Assembly Types page header.
2. You select a `.csv` file with the following column format:

```text
assembly_name, assembly_type, item_name, sku, quantity, notes
"Window Frame A", "Windows", "Aluminum Rail", "ALU-001", 4, ""
"Window Frame A", "Windows", "Glass Panel", "GLS-002", 2, "tempered"
"Door Assembly B", "Doors", "Hinge Set", "HNG-010", 3, ""
```

3. Rows sharing the same `assembly_name` are grouped into a single assembly.
4. A preview dialog shows a summary: each assembly name, its type, and how many items it contains.
5. Items are auto-matched to inventory by SKU when possible (linking `inventory_item_id`).
6. On confirm, assemblies are created and their items inserted in bulk.
7. A toast confirms how many assemblies were created.

### Technical Details

**File to modify: `src/pages/AssemblyTypes.tsx`**

- Add a hidden file input and "Import CSV" button (with Upload icon) in the header next to the existing "New Type" button.
- Add CSV parsing logic:
  - Split by newlines, then by commas (handling quoted values).
  - Required columns: `assembly_name`, `item_name`, `sku`, `quantity`. Optional: `assembly_type` (defaults to "General"), `notes`.
  - Group rows by `assembly_name` to determine distinct assemblies.
- Add a preview Dialog showing:
  - A table listing each assembly to be created, its type, and item count.
  - An expandable or scrollable view of the items per assembly.
  - Warnings for any rows missing required fields.
- On confirm:
  - For each unique assembly, call `createAssembly(name, description, type)` from the `useAssemblies` hook.
  - Then for each assembly's items, insert into `assembly_items` table directly (batch insert via Supabase) using the new assembly's ID.
  - Before inserting items, query `inventory_items` to match SKUs and auto-link `inventory_item_id`.
- After all inserts complete, call `refetch()` and show a summary toast.

**No database changes required** -- uses existing `assemblies` and `assembly_items` tables.

