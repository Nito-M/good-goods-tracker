

## Remove "Completed" from Job Status Options

### What Changes
Remove the "Completed" status option from the job status dropdown in both the Create Job and Edit Job pages, as well as from the status color map used on the Jobs list and Job Description pages.

### Files to Update

**1. `src/pages/CreateJob.tsx`** (line ~21)
- Remove `{ value: 'completed', label: 'Completed' }` from `STATUS_OPTIONS`

**2. `src/pages/EditJob.tsx`** (line ~21)
- Remove the same entry from `STATUS_OPTIONS`

**3. `src/pages/Jobs.tsx`**
- Remove `completed` from the `statusColors` map and from any status filter/options array

**4. `src/pages/JobDescription.tsx`**
- Remove `completed` from the `statusColors` map

