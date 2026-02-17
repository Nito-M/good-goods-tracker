

## Desktop Table View for Jobs List

### What it does
On desktop screens (768px+), jobs will display as a compact table with one job per row. On mobile, the current card grid layout stays exactly the same.

### Desktop Table Columns
- Drag handle (grip icon)
- Job Number
- Title
- Customer
- Status (badge)
- Due Date
- Created Date

### Changes in `src/pages/Jobs.tsx`

**1. Import `useIsMobile` hook**
Add import from `@/hooks/use-mobile` to detect screen size.

**2. Add table view for desktop**
Replace the current grid rendering block (lines 177-221) with a conditional:
- If mobile: render the existing card grid (unchanged)
- If desktop: render a `Table` with sortable rows, showing job data in columns

The table rows will:
- Be clickable to open the job detail (same as cards)
- Support drag-and-drop reordering (same as cards)
- Show the grip handle, job number, title, customer name, status badge, due date, and created date
- Have hover highlighting for better UX

**3. No new components or dependencies needed**
The `Table` components and `useIsMobile` hook already exist in the project.

### Technical Details

```text
Mobile (< 768px):
+------------------+  +------------------+
|  Job Card        |  |  Job Card        |
|  #JOB-001        |  |  #JOB-002        |
|  Title           |  |  Title           |
|  Customer        |  |  Customer        |
|  Status  Date    |  |  Status  Date    |
+------------------+  +------------------+

Desktop (>= 768px):
+------+----------+-----------+----------+--------+----------+---------+
| Grip | Job #    | Title     | Customer | Status | Due Date | Created |
+------+----------+-----------+----------+--------+----------+---------+
|  ::  | JOB-001  | Kitchen.. | Smith    | Open   | 03/15    | 02/01   |
|  ::  | JOB-002  | Bathroom  | Jones    | Hold   | 04/01    | 02/10   |
+------+----------+-----------+----------+--------+----------+---------+
```

### Files to update
- `src/pages/Jobs.tsx` -- add `useIsMobile`, conditional rendering with table view for desktop

