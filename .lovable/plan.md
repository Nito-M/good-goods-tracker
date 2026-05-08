## Goal

Let admins grant a non-admin member view+edit access to specific workers (and their vendor accounts + files), without giving them the global "View All Workers & Vendor Accounts" permission.

## How it works for the user

- **From a Worker page** (e.g. `/workers/:id`): a new "Access" section lets the admin pick org members who can see and edit this worker. Granted members get full view + edit on that worker's info, vendor accounts, and files (delete still admin-only).
- **From Users settings** (`UsersSettings.tsx`): when editing a member, a new "Worker Access" picker lists all workers in the org so the admin can check the ones that member can access. Same underlying grant — both directions stay in sync.
- Members who have the global `view_all_workers` feature still see everything (unchanged). Members always see workers they created themselves (unchanged). The new grants are additive.

## Technical details

**New table:** `worker_access_grants`
- `worker_id` (FK → workers, on delete cascade)
- `user_id` (uuid, member receiving access)
- `granted_by` (uuid)
- unique (`worker_id`, `user_id`)
- RLS:
  - SELECT: row's `user_id = auth.uid()` OR org admin/owner of the worker's org OR `users_share_org` with worker creator
  - INSERT/DELETE: only org admin/owner of the worker's org (via `is_org_admin_or_user`-style check on the worker's owning user)

**New security-definer function:** `has_worker_access(_user_id uuid, _worker_id uuid)` returns true if the user is the worker's creator, an org admin/owner of the worker's org, has `view_all_workers` feature, or has a row in `worker_access_grants`. Used to keep RLS simple and avoid recursion.

**Update RLS policies** on `workers`, `worker_vendors`, `worker_files`:
- Replace existing member SELECT/UPDATE policies so they also pass when `has_worker_access(auth.uid(), worker_id)` is true.
- DELETE remains admin/owner only (unchanged).

**Frontend changes:**
- `src/pages/WorkerDetail.tsx`: add an "Access" card (visible only to admins/owners) listing org members with checkboxes; toggling inserts/deletes rows in `worker_access_grants`. Reuse the org-members fetch pattern from `OrganizationsSettings.tsx`.
- `src/components/UsersSettings.tsx`: in the user edit dialog, add a "Worker Access" multi-select listing all org workers; on save, diff against existing grants and insert/delete accordingly.
- `src/hooks/useWorkers.ts` / `useWorkerVendors.ts`: no logic change needed — RLS handles visibility — but verify queries don't filter by `user_id` client-side in a way that hides granted workers. Adjust if they do.

## Out of scope

- No changes to delete permissions.
- No notifications to granted members.
- No bulk "grant access to all workers" shortcut.
