
## Move Edit and Delete Buttons from Jobs List to Job Details

### What changes
1. **Remove Edit and Delete buttons from the job cards** on the Jobs list page (lines 280-283). The card will remain clickable to navigate into Job Details.

2. **Remove the Edit Dialog and Delete AlertDialog** from the Jobs list component (lines 293-359), along with related state (`editingJob`, `deletingJobId`) and handlers (`openEdit`, `handleUpdate`, `handleDelete`, form state variables).

3. **Add Edit and Delete functionality directly into the JobDetail component**:
   - Add a "Delete" button next to the existing "Edit Job" button in the Job Details header
   - Move the Edit Dialog and Delete AlertDialog into the JobDetail component
   - The JobDetail component will manage its own edit form state and delete confirmation

4. **Update JobDetail props**: Replace the `onEdit` callback with direct edit/delete handling inside JobDetail. Add `onDelete` callback so the parent can handle navigation back to the list after deletion.

### Technical Details

**File: `src/pages/Jobs.tsx`**

- Remove state variables: `editingJob`, `deletingJobId`, `formTitle`, `formDescription`, `formStatus`, `formJobNumber`, `formCustomerName`, `formCustomerEmail`, `formCustomerPhone`, `formCustomerAddress`, `selectedCustomerId`
- Remove functions: `openEdit`, `handleUpdate`, `handleDelete`, `handleCustomerSelect`
- Remove the Edit and Delete buttons from the job card (lines 280-283)
- Remove the Edit Dialog JSX (lines 293-345) and Delete AlertDialog JSX (lines 347-359)
- Update `JobDetail` call: remove `onEdit`, add `onDelete` that clears `selectedJobId`
- Pass `updateJob`, `deleteJob`, and `customers` as props to `JobDetail`

**JobDetail component updates:**
- Add internal state for edit dialog, delete confirmation, and form fields
- Add Edit Dialog and Delete AlertDialog JSX (moved from parent)
- Add a Delete button (red, with Trash2 icon) in the header alongside Edit Job
- Handle customer selection within the component
