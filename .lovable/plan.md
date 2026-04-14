

## Plan: Prevent Duplicate Part Numbers on Import/Drop

### Problem
Currently you can drag a part and drop it back into the same library, or import a JSON file, and it creates a duplicate even if a part with that Part Number already exists.

### Solution
Add a duplicate-check before creating a part in all import paths (drag-drop, JSON file drop, and Import JSON button). If a part with the same Part Number (SKU) already exists in the library, skip it and show a toast saying it was skipped.

### Files to change

1. **`src/pages/PartsLibrary.tsx`** — In `importPartFromJson`, check if `parts` array already contains a part with the same `sku` before calling `addPart`. Skip and toast if duplicate found.

2. **`src/pages/PartsLibrary2.tsx`** — Same duplicate check.

3. **`src/components/PartJsonImport.tsx`** — Accept `existingParts` prop (or just the list of existing SKUs), check before calling `addPart`. Skip duplicates with a toast.

### Logic
```typescript
// Before addPart:
if (data.sku && parts.some(p => p.sku.toLowerCase() === data.sku.toLowerCase())) {
  toast({ title: 'Skipped', description: `Part # "${data.sku}" already exists.`, variant: 'destructive' });
  return;
}
```

