
## Hide Jobs Column, Add Expandable Row to Show Jobs

### What Changes
Remove the "Jobs" column from the All Job Items table. Instead, make each item row clickable/expandable to reveal which jobs it belongs to.

### File to Update

**`src/pages/AllJobItems.tsx`**

1. Remove the `<TableHead>Jobs</TableHead>` column header
2. Remove the `<TableCell>` that displays `item.jobs.join(', ')`
3. Add state to track which item row is expanded (`expandedRow: number | null`)
4. Make each `<TableRow>` clickable with `cursor-pointer` styling
5. When clicked, toggle an additional row below that displays the list of jobs as badges or a simple list
6. The expanded detail row spans the full table width (`colSpan={5}`) and shows the job names

### Interaction
- Click a row to expand and see the jobs list underneath
- Click again to collapse
- Only one row expanded at a time (or multiple, depending on preference -- will use toggle per row)
