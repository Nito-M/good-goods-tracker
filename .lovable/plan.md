

## Sort Jobs by Due Date

### What Changes
Update the jobs query to sort by `due_date` instead of `display_order`, so jobs with the earliest due dates appear first. Jobs without a due date will appear at the end of the list.

### Changes

**File: `src/hooks/useJobs.ts`** (line 18)
- Change `.order('display_order', { ascending: true })` to `.order('due_date', { ascending: true, nullsFirst: false })`
- This puts jobs with the soonest due date at the top, and jobs with no due date at the bottom

Note: The existing drag-and-drop reorder functionality (which uses `display_order`) will no longer visually persist since the sort is now driven by due date. If you'd like to keep manual reordering as a secondary option, let me know.

