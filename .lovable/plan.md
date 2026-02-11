
# Add Status Dropdown to Job Details

## What Changes

Add a status dropdown directly in the Job Details view so users can quickly change a job's status without opening the Edit dialog. The dropdown will include the new production-oriented statuses:

- Open
- In Progress
- In Production
- Welding Done
- Painting Done
- Finished
- Completed
- Cancelled

These same statuses will also be added to the Edit Job dialog's status dropdown for consistency.

## Technical Details

### 1. Update status colors map (Jobs.tsx, line ~20)
Add color entries for the new statuses:
- `in-production` - purple badge
- `welding-done` - orange badge  
- `painting-done` - teal badge
- `finished` - emerald badge

### 2. Add status dropdown to Job Detail header area (Jobs.tsx, ~line 507)
Replace the static Badge in the Job Summary card's "Status" row with a `Select` dropdown. When changed, it will call `updateJob` directly to persist the new status.

To do this, the `JobDetail` component needs access to `updateJob` from the `useJobs` hook. This will be passed as a new prop or the hook can be called directly inside `JobDetail`.

### 3. Update the Edit Job dialog (Jobs.tsx, ~line 312)
Add the new status options (`in-production`, `welding-done`, `painting-done`, `finished`) to the existing status `Select` in the Edit dialog.

### 4. Update the Create Job dialog
Add a status field to the Create dialog as well so users can set the initial status.

### Files Modified
- `src/pages/Jobs.tsx` - Add status options, dropdown in detail view, pass updateJob
