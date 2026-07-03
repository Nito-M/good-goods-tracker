## Goal
Add an **Instructions** tab to the Job details page for capturing install/how-to instructions per job. Each instruction has a title, rich text body, and attached PDFs/images. Adding/editing happens on a dedicated full-page route.

## Database

New tables (both org-shared via `users_share_org`, standard `authenticated` grants + `service_role`).

**`job_instructions`**
- `job_id` (FK → jobs, cascade delete)
- `user_id` (FK → auth.users) — job owner, used for org-scoping
- `title` text
- `content` text (nullable) — freeform text body
- `display_order` int default 0
- standard id / created_at / updated_at + updated_at trigger

**`job_instruction_files`**
- `instruction_id` (FK → job_instructions, cascade delete)
- `user_id`
- `file_name`, `file_url`, `file_type` (mime), `display_order`
- id / created_at

**RLS:** SELECT/INSERT/UPDATE/DELETE where `users_share_org(auth.uid(), user_id)`. Mirrors existing `vendor_files` / `customer_files` patterns.

**Storage:** new private bucket `job-instruction-files`. RLS on `storage.objects`: authenticated users can read/write objects in that bucket where the first path segment is a job the user shares an org with. Uploads stored under `{job_id}/{instruction_id}/{uuid}-{filename}`.

## Frontend

**Hook `src/hooks/useJobInstructions.ts`**
- `useJobInstructions(jobId)` → list + `createInstruction`, `updateInstruction`, `deleteInstruction`.
- `useJobInstruction(instructionId)` → single record + attached files + `uploadFile`, `deleteFile` (calls storage + row).

**Job details tab (`src/pages/Jobs.tsx`)**
- Extend `tab` union to include `'instructions'`; add `<TabsTrigger value="instructions">Instructions ({count})</TabsTrigger>`.
- Tab content: header row with "Add Install Instruction" button → navigates to `/jobs/:jobId/instructions/new`. Below, a list of cards showing title, snippet, file count, updated date. Clicking a card → `/jobs/:jobId/instructions/:instructionId`. Row-level delete button with confirm.

**Full-page route `src/pages/JobInstructionEdit.tsx`** (used for both new + edit)
- Route added to `src/App.tsx`: `/jobs/:jobId/instructions/new` and `/jobs/:jobId/instructions/:instructionId`. Renders outside `AppLayout` for full-page feel (matches `JobAddItems` pattern).
- Layout: sticky header with Back button and Save button. Body:
  - **Title** input (required)
  - **Instructions** textarea (auto-growing), placeholder "Steps, notes, part numbers..."
  - **Files** section: drop zone + "Upload PDF/Images" button (accept `application/pdf,image/*`). Grid of uploaded files with thumbnail for images, PDF icon + filename for PDFs, click to open in new tab, delete button per file. Uses `useJobInstruction` upload/delete.
- For "new" mode: creating the instruction row happens on first Save (title required); until saved, file uploads are disabled with hint "Save the title first to attach files."
- Auto-save title/content on Save button; navigate back to the job's Instructions tab.

**Files touched**
- `supabase/migrations/*` — tables, RLS, storage bucket + policies
- `src/integrations/supabase/types.ts` — regenerated
- `src/hooks/useJobInstructions.ts` — new
- `src/pages/JobInstructionEdit.tsx` — new
- `src/pages/Jobs.tsx` — add tab + list
- `src/App.tsx` — add two routes

## Out of scope
- Rich-text/markdown rendering — plain textarea for now.
- Reordering instructions or files (uses `display_order` field but no drag UI yet).
- Sharing instructions across jobs / templates.
