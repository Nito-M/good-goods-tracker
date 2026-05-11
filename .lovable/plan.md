## Goal

When opening a job, show **Information** first, with tabs at the top to switch between **Information**, **Parts**, and **Settings**.

## Tabs

1. **Information** (default)
   - Job title, number, status, due date, created date
   - Description (from `JobDescription.tsx`)
   - Customer block (name, email, phone, address)
   - Job summary stats (item count, total qty, total value)

2. **Parts**
   - Current grouped-by-category items table (thumbnails, qty, stock, reserve/consumed badges, ordered badge, delete)
   - "Add Items" button stays in the tab

3. **Settings**
   - The form fields currently in `EditJob.tsx` (title, job number, description, status, due date, customer details, save/cancel)
   - Plus the destructive "Delete Job" action and "Duplicate Job" action moved here from the header

## Changes

- `src/pages/Jobs.tsx` → `JobDetail` component:
  - Wrap content in `<Tabs defaultValue="information">` with a `TabsList` directly under the page header
  - Move existing items grid into `<TabsContent value="parts">`
  - Build `<TabsContent value="information">` from the description/customer/summary blocks (reusing the existing summary/customer cards that currently sit in the right sidebar)
  - Build `<TabsContent value="settings">` containing an inline edit form (extracted from `EditJob.tsx`) plus Duplicate + Delete actions
  - Header keeps Back, title, status badge — remove the Add Items / Duplicate / Edit / Delete buttons (Add Items moves into Parts tab; Duplicate + Delete move into Settings tab; Edit is replaced by the Settings tab itself)

- Optional: keep `/jobs/:jobId/description` and `/jobs/:jobId/edit` routes working for backwards compatibility (they still render the existing standalone pages), but the in-app links from `JobDetail` no longer use them.

## Out of scope

- No DB/schema changes
- No changes to `Jobs` list page, `JobAddItems`, or job hooks
- No styling overhaul beyond the tab layout
