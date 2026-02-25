

## Show Member Emails on Organizations Screen

### Problem
The Organizations settings screen shows member names and roles but not their email addresses. Since emails are stored in the auth system (not in public tables), we need to use the existing `lookup-users-by-ids` edge function to fetch them.

### Implementation

**File: `src/components/OrganizationsSettings.tsx`**

1. Add `email` to the `OrgMember` interface (it's already there but not populated).

2. In `fetchOrganizations`, after fetching profiles for each org's members, collect all unique user IDs across all orgs and make a single call to the `lookup-users-by-ids` edge function to get their emails.

3. Merge the returned emails into each member object in `membersMap`.

4. In the member list UI, display the email below or next to the display name using a secondary text style (e.g., `text-xs text-muted-foreground`).

### Technical Details

- After the existing member/profile fetch loop, gather all user IDs into a flat array.
- Call `supabase.functions.invoke('lookup-users-by-ids', { body: { user_ids: allUserIds } })`.
- Map the returned `{ users: { [id]: email } }` into each org's member entries.
- In the render, show: `{member.email && <span className="text-xs text-muted-foreground">{member.email}</span>}`.

### Files to Modify
- `src/components/OrganizationsSettings.tsx` (only file)

