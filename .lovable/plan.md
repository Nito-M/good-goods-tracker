## Goal

Workers (Staff Directory profiles) should be visible only to:
- The worker themselves (`auth.uid() = workers.user_id`)
- Org admins/owners of an org that the worker's user belongs to (same-org admin)

No cross-organization visibility, even for users that currently hold the `view_all_workers` feature flag.

## Why isaac@fabaulmfg.com showed up in FM Fabrications

The FM Fabrications admin has the `view_all_workers` feature permission. The current `workers` SELECT policy treats that flag as "see every worker in the database" with no org scoping, so it leaks workers from other orgs (e.g. Fabaul Manufacturing's isaac).

## Fix (single migration, no code changes)

Rewrite the SELECT and UPDATE RLS policies on `public.workers` to drop the unscoped `view_all_workers` branch. Keep them simple:

SELECT / UPDATE allowed when:
1. `auth.uid() = workers.user_id`, OR
2. `public.is_org_admin_of_user(auth.uid(), workers.user_id)` — viewer is admin/owner of an org the worker's user is in, OR
3. There is a matching row in `worker_access_grants` (explicit per-worker share)

DELETE policy unchanged (already scoped to self + same-org admin).
INSERT policy unchanged.

The `view_all_workers` feature flag will no longer expand visibility across orgs. If you still want a "see all workers" power-user flag in the future, we'd add it back as `view_all_workers AND users_share_org(auth.uid(), workers.user_id)` — same-org only.

After the migration, FM Fabrications members will only see workers whose user is a member of FM Fabrications. isaac@fabaulmfg.com will disappear from their Staff Directory.

Shall I run the migration?