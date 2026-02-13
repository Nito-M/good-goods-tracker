

## Fix Due Date Off-By-One Issue

### Problem
When you enter a due date like "March 15", it displays as "March 14". This happens because:
1. The date input gives a string like `"2025-03-15"`
2. `new Date("2025-03-15")` treats it as UTC midnight
3. When displayed, your local timezone (behind UTC) shifts it back one day

### Solution
Apply the same local-noon date strategy already used elsewhere in the app: instead of `new Date(formDueDate).toISOString()`, construct the date at local noon so timezone offsets never shift the day.

### Changes

**1. `src/pages/CreateJob.tsx`** (1 line)
- Change: `new Date(formDueDate).toISOString()`
- To: Parse the `YYYY-MM-DD` string and build a Date at local noon before calling `.toISOString()`

**2. `src/pages/EditJob.tsx`** (1 line)
- Same fix for the `due_date` value in the update object

**3. `src/pages/Jobs.tsx`** (2 spots displaying due dates)
- Change `new Date(job.dueDate).toLocaleDateString()` to parse at local noon first, preventing the day shift on display

**4. `src/pages/JobDescription.tsx`** (1 spot)
- Same display fix for the due date shown in the job header

### Technical Detail
```typescript
// Before (broken):
new Date(formDueDate).toISOString()

// After (fixed):
const [y, m, d] = formDueDate.split('-').map(Number);
new Date(y, m - 1, d, 12, 0, 0).toISOString()
```

For display:
```typescript
// Before (broken):
new Date(job.dueDate).toLocaleDateString()

// After (fixed):
const dt = new Date(job.dueDate);
new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12).toLocaleDateString()
```

This matches the project's established date-handling pattern used in Purchase Orders, Sales, and Quotes.
