
## Make Edit Job a Full Page

### What changes

1. **New file: `src/pages/EditJob.tsx`** -- A full-page edit form mirroring the `CreateJob` layout, with:
   - Full-width description textarea (visible without scrolling, larger rows)
   - Same two-card layout (Job Details + Customer Details) as CreateJob
   - Loads the existing job data from the database by job ID (from URL param)
   - Includes a "Save Changes" button and "Cancel" link back to the job
   - Customer auto-fill from saved customers list

2. **Update `src/App.tsx`** -- Add a new route `/jobs/:jobId/edit` pointing to the `EditJob` component, wrapped in `ProtectedRoute` and `AppLayout`.

3. **Update `src/pages/Jobs.tsx` (JobDetail component)** -- Replace the "Edit Job" button's `onClick` from opening a dialog to navigating to `/jobs/{jobId}/edit`. Remove all edit dialog state, the `openEdit` function, the `handleCustomerSelect` function, the `handleUpdate` function, and the Edit Dialog JSX (lines 514-566). The Delete button and its AlertDialog remain as-is.

### Technical Details

**`src/pages/EditJob.tsx`** (new file):
- Uses `useParams` to get `jobId`
- Uses `useJobs` hook to get `updateJob` and the job list to find the current job
- Pre-fills all form fields from the job data on mount
- Description field uses `<Textarea rows={6}>` so the full text is visible
- On save, calls `updateJob` then navigates back to `/jobs` (which will show the detail view)
- Layout matches `CreateJob` exactly (max-w-3xl, same header style, same card structure)

**`src/pages/Jobs.tsx` cleanup**:
- Remove state: `editOpen`, `formTitle`, `formDescription`, `formStatus`, `formJobNumber`, `formCustomerName`, `formCustomerEmail`, `formCustomerPhone`, `formCustomerAddress`, `selectedCustomerId`
- Remove functions: `openEdit`, `handleCustomerSelect`, `handleUpdate`
- Remove Edit Dialog JSX (lines 514-566)
- Change Edit button to: `onClick={() => navigate(`/jobs/${job.id}/edit`)}`
- Remove `customers` prop from `JobDetailProps` since it is no longer needed
- Remove `customers` being passed to `JobDetail` from the parent

**`src/App.tsx`**:
- Import `EditJob`
- Add route: `<Route path="/jobs/:jobId/edit" element={<ProtectedRoute><AppLayout><EditJob /></AppLayout></ProtectedRoute>} />`
