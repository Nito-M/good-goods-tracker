

## Add "On Hold" Job Status

### What it does
Adds a new **"On Hold"** status for jobs you don't want to work on right away. Items from on-hold jobs will be excluded from the "All Job Items" view, keeping your material planning focused on active work only.

### Changes

**1. Add "On Hold" status option to job status dropdowns**
- Update `src/pages/CreateJob.tsx`, `src/pages/EditJob.tsx`, and the status dropdown in the job detail view to include "on-hold" as a selectable status.

**2. Style the status badge**
- Add an "on-hold" entry to all `statusColors` maps across the app (Jobs list, Job Detail, Job Description pages) with a gray/neutral color theme (e.g., gray-100/gray-800) to visually distinguish it from active statuses.

**3. Exclude on-hold jobs from All Job Items**
- Update the `useAllJobItems` hook query to also filter out `on-hold` jobs (alongside the existing `finished` filter), so their items don't appear in the material planning view.

### Technical Details

- In `src/hooks/useJobs.ts`, the `useAllJobItems` query currently has `.neq('jobs.status', 'finished')`. This will be updated to also exclude `on-hold` by adding `.neq('jobs.status', 'on-hold')`.
- Status color: `'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'`
- Files to update:
  - `src/hooks/useJobs.ts` (exclude on-hold from all items query)
  - `src/pages/Jobs.tsx` (status color map)
  - `src/pages/JobDescription.tsx` (status color map)
  - `src/pages/CreateJob.tsx` (status select options)
  - `src/pages/EditJob.tsx` (status select options + color map)
  - Any job detail page with status dropdown

