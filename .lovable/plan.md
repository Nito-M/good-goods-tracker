

# Add Requester Management to the Requests Page (Admin-Only)

## Overview
Add a collapsible "Manage Requesters" section at the top of the Requests page that only admins can see. This will allow admins to add, delete, and link requester names to users -- all without leaving the Requests page.

## What You'll See
- Admins will see a "Manage Requesters" button/section at the top of the Requests page
- Clicking it expands a panel showing all requester names for the organization
- Admins can add new requester names, delete existing ones, and link/unlink them to users
- Regular (non-admin) users will not see this section at all

## Technical Details

### 1. Create a new `RequestersManager` component (`src/components/RequestersManager.tsx`)
- A collapsible card/section using the existing Collapsible UI component
- Displays a list of all `org_requesters` for the user's organization(s)
- Each requester row shows the name and linked user (if any)
- "Add Requester" button opens a small inline form or dialog to insert a new name into `org_requesters`
- Delete button removes a requester from `org_requesters`
- A dropdown to link/unlink a requester to an org member (using the same logic as `UsersSettings.tsx` `handleLinkRequester`)

### 2. Create a `useOrgRequesters` hook (`src/hooks/useOrgRequesters.ts`)
- Fetches all `org_requesters` for the user's organization(s)
- Provides `addRequester(name)`, `deleteRequester(id)`, `linkRequester(id, userId)`, `unlinkRequester(id)` functions
- Fetches org members (with display names) for the linking dropdown
- Reuses the existing `organization_members` and `org_requesters` tables (no database changes needed)

### 3. Update the Requests page (`src/pages/Requests.tsx`)
- Import and render `RequestersManager` above the search bar
- Only show it when `isAdminUser` is true (from `useLinkedRequester`)
- Pass the `allOrgRequesterNames` refresh callback so adding/removing requesters updates the requester name dropdowns in the Add/Edit Request dialogs

### 4. No database changes needed
- The `org_requesters` table already exists with the correct schema (`id`, `name`, `organization_id`, `linked_user_id`)
- Existing RLS policies on `org_requesters` already allow org members to read and org admins to manage
