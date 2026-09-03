# Admins Can Create User Accounts

Today an admin can only add someone who *already has an account*: Settings > Users looks the email up and fails with "They must have an account first." That's why account creation has to happen in the background. This adds account creation directly into the app.

## What changes

In Settings > Users, the existing "Add User" dialog gains an initial-password field and creates the account when no account exists yet:

- Admin enters name, email, and an initial password (min 8 characters, with a confirm field and a "generate password" helper).
- The account is created immediately, the person can sign in right away, and the admin passes the password along.
- The new user is added to the chosen organization as a member, their display name is set, and the page permissions already selected in the dialog are applied — exactly as today.
- If the email already belongs to an account, behaviour is unchanged: it links that existing user into the organization instead of creating a duplicate, and the password field is ignored (with a clear message).

Guardrails:
- Only organization owners/admins (and super admins) can do this.
- The organization's max-users limit still applies; exceeding it returns a clear error and no account is created.
- Email is normalized/validated; duplicate emails are rejected safely.
- The new account is created email-confirmed so the person can log in with the password right away, and the creation shows up in the new Activity Log.

## Technical details

- New edge function `supabase/functions/admin-create-user/index.ts`:
  - Validates the caller's JWT in code, then confirms via service role that the caller is a super admin or an owner/admin of the target organization (same pattern as `lookup-user-by-email`).
  - Validates body with Zod: `email`, `display_name`, `password` (min 8), `organization_id`, `page_keys[]`.
  - Checks `organization_members` count against `organizations.max_users` before creating.
  - `auth.admin.createUser({ email, password, email_confirm: true, user_meta_data: { display_name } })`; the existing `on_auth_user_created` trigger creates the profile row.
  - Inserts the `organization_members` row (role `member`), updates `profiles.display_name`, inserts `user_page_permissions` rows.
  - If a post-creation step fails, the newly created auth user is deleted so no orphan account remains.
  - Returns `{ user_id, created: true|false }` — `created: false` when the email already existed, so the client can fall back to the current link-existing-user path.
- `src/components/UsersSettings.tsx`: add password/confirm state to the add-user dialog, call `admin-create-user` first, and keep the existing lookup/link path for accounts that already exist. Toasts distinguish "Account created" from "Existing user added".
- No schema migration required; no new secrets required (`SUPABASE_SERVICE_ROLE_KEY` is already available to functions).
