
## Add Assembly Support to the "Add Items to Job" Page

### What Changes

The `JobAddItems` page currently only lets users pick individual inventory items. The request is to add a second section — an "Add from Assembly" tab/section — where the user can browse assemblies and, with one button press, add all the internal sub-items of that assembly as individual job items.

### How It Works

1. A new **"Assemblies" tab** is added alongside the existing "Inventory Items" tab on the `JobAddItems` page.
2. The assemblies list shows each assembly name, description, item count, and total cost.
3. Each assembly row has an **"Add All Items" button**.
4. When clicked, every sub-item inside that assembly (`assembly_items`) is inserted into `job_items` for this job — one row per sub-item, preserving name, SKU, quantity, and `inventory_item_id` links.
5. If a job item with the same `inventory_item_id` already exists, the quantities are **summed** (for linked items). Custom assembly items (no `inventory_item_id`) are always appended as new rows.

### Files to Modify

- **`src/pages/JobAddItems.tsx`** — Add Tabs UI, import `useAssemblies` and `useAssemblyItems`, implement `handleAddAssembly` logic.

### Technical Detail

The `useAssemblies` hook already fetches all assemblies. The `useAssemblyItems` hook fetches items for a specific assembly. To add an assembly's items to a job, we need to:

1. Fetch assembly items for the selected assembly (via a one-off supabase query to avoid having to mount a hook per assembly).
2. Loop through each assembly item and call `addItem` or `updateItem` depending on whether the item already exists in the job.

Since hooks can't be called conditionally, the add logic will do a direct Supabase query for the assembly items inside the handler function (same pattern used throughout the codebase), rather than relying on the `useAssemblyItems` hook.

### Logic Sketch

```typescript
const handleAddAssembly = async (assemblyId: string) => {
  setAddingAssembly(assemblyId);
  
  // Fetch assembly's sub-items directly
  const { data: asmItems } = await supabase
    .from('assembly_items')
    .select('*')
    .eq('assembly_id', assemblyId);

  for (const asmItem of asmItems ?? []) {
    // Check if this inventory item is already in the job
    const existing = jobItems.find(
      ji => ji.inventoryItemId && ji.inventoryItemId === asmItem.inventory_item_id
    );

    if (existing && asmItem.inventory_item_id) {
      // Increment quantity on the existing job item
      await updateItem(existing.id, { quantity: existing.quantity + asmItem.quantity });
    } else {
      // Add as a new job item
      await addItem({
        inventoryItemId: asmItem.inventory_item_id ?? undefined,
        itemName: asmItem.item_name,
        sku: asmItem.sku || '',
        quantity: asmItem.quantity,
        unitPrice: 0, // Assembly items don't have a unit price; user can edit after
        notes: asmItem.notes ?? undefined,
      });
    }
  }

  toast({ title: 'Assembly items added to job' });
  setAddingAssembly(null);
};
```

### UI Layout

The page gains a **Tabs** component (using the existing `@radix-ui/react-tabs` / shadcn Tabs):

```
[ Inventory Items ]  [ Assemblies ]
┌─────────────────────────────────────┐
│  Assembly Name          3 items     │
│  Description text       Cost: $120  │  [Add All Items]
├─────────────────────────────────────┤
│  Assembly Name 2        5 items     │  [Add All Items]
└─────────────────────────────────────┘
```

### No Database Changes

All required tables (`assemblies`, `assembly_items`, `job_items`) already exist. No migrations needed.
