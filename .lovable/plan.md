
## Assembly Summary with Total Price

### What's Changing

Each assembly card in the left panel will show a summary including:
- Assembly name
- Description (if any)
- Item count
- Total cost of all items (quantity × unit cost from inventory)

The selected assembly's right panel header will also display the total prominently.

### How the Total Is Calculated

Each `assembly_item` links to an `inventory_item` via `inventory_item_id`. The `inventory_items` table has a `cost` column. The total is:

```
Total = SUM(assembly_item.quantity × inventory_item.cost)
```

For custom items (where `inventory_item_id` is null), no cost is added since there's no inventory record to pull cost from. These will be excluded from the total with a note shown if any custom items exist.

### Data Approach

Rather than fetching all assembly items individually for every assembly in the list, a single efficient query will be added to `useAssemblies` that fetches all assembly items with their joined inventory cost in one go. This avoids N+1 queries and keeps the sidebar fast.

The query will look like:
```sql
SELECT assembly_id, SUM(ai.quantity * COALESCE(ii.cost, 0)) as total_cost, COUNT(*) as item_count
FROM assembly_items ai
LEFT JOIN inventory_items ii ON ai.inventory_item_id = ii.id
GROUP BY assembly_id
```

This will be done client-side using a single Supabase select with a join.

### Files to Modify

**`src/hooks/useAssemblies.ts`**
- Add a new `useAssemblySummaries` hook that fetches all assembly items joined with their inventory cost in a single query
- Returns a `Map<assemblyId, { totalCost: number; itemCount: number }>` for O(1) lookup

**`src/pages/Assemblies.tsx`**
- Use `useAssemblySummaries` in the main `Assemblies` component
- Update the left panel assembly list buttons to show item count and total cost badge
- Update the right panel `AssemblyDetail` header to show total cost prominently (using `formatCurrency` from `src/lib/utils.ts`)
- Pass the summary data down as a prop

### UI Changes

Left panel — each assembly entry:
```
> 16ft Flatbed Trailer
  Standard flatbed build        ← description
  12 items · $4,823.50          ← item count + total cost
```

Right panel header — selected assembly:
```
[Assembly Name]          [Edit] [Delete]
Description text...
                  Total: $4,823.50  (12 items)
```

### Technical Notes

- Uses `formatCurrency` from `src/lib/utils.ts` for consistent 2–5 decimal display
- The join uses `inventory_item_id` which is nullable; a `LEFT JOIN` ensures custom items still appear in the count but contribute $0 to cost
- No database changes required — all existing columns are already available
- Summary data re-fetches automatically when assemblies refresh
