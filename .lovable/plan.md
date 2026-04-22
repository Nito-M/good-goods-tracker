

## Board Permissions System

Add per-board access control letting the board owner (and org admins) decide **who can see the board** and, for each visible user, **which columns are blocked or read-only**.

### Where to manage permissions

A new **"Manage Access"** button in the board's header dropdown (next to Rename / Delete in `BoardDetail.tsx`). It opens a side sheet titled **Board Access**, the natural place because:
- Settings live with the board they apply to (not buried in app Settings).
- Only org members who can edit the board see the button.
- Same pattern users already know from the Notes side panel.

### The Board Access panel

Two sections in one sheet:

**1. Members**
List every user in the organization with a row each:
- Avatar + name + email
- Toggle: **Has access** (off = board hidden from sidebar/list and route blocked)
- Owner row is locked (always full access)

**2. Column permissions** (per member, expandable under their row)
For each board column, three radio choices:
- **Full access** (default) — view + edit
- **View only** — sees the column, can't change cells
- **Hidden** — column is invisible; cells skipped during render

Org admins always have full access and bypass these checks.

### Behavior on the board

- **No access** → board doesn't appear in `/boards` list, navigating directly redirects with a toast.
- **Hidden columns** → filtered out of the columns array client-side; cells, headers, and the group-by selector skip them.
- **View-only columns** → cells render in a read-only state (inputs disabled, status pickers don't open, no hover edit affordances). Server enforces it via RLS.

### Data model

New table `board_member_access`:
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| board_id | uuid | FK boards, cascade |
| user_id | uuid | the org member granted access |
| created_at | timestamptz | |

Unique on (board_id, user_id). Presence of a row = user has board access.

New table `board_column_permissions`:
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| board_id | uuid | FK boards, cascade |
| column_id | uuid | FK board_columns, cascade |
| user_id | uuid | |
| permission | text | `'edit' \| 'view' \| 'hidden'` |

Unique on (column_id, user_id). Default (no row) = `edit`.

**RLS rules** (using `users_share_org` and a new SECURITY DEFINER `has_board_access(_user, _board)` helper to avoid recursion):

- `boards` SELECT: owner OR org admin OR has row in `board_member_access`.
- `board_columns` / `board_cells` SELECT/UPDATE: must pass `has_board_access` AND column permission ≠ `hidden` (and ≠ `view` for writes). Owner & org admins bypass.
- `board_member_access` & `board_column_permissions` writable only by board owner or org admin.

**Default for new boards**: only the creator has access. They open the panel to invite others.

**Backfill migration**: insert a `board_member_access` row for every existing org member of every existing board so current behavior is preserved.

### Files

New:
- `supabase/migrations/...` — two tables, RLS policies, backfill, `has_board_access` function.
- `src/hooks/useBoardAccess.ts` — fetch members + column permissions, mutations.
- `src/components/board/BoardAccessSheet.tsx` — the side panel UI.

Edited:
- `src/pages/BoardDetail.tsx` — add "Manage Access" menu item; filter hidden columns; pass `readOnlyColumnIds` to cells; route-guard if no access.
- `src/hooks/useBoard.ts` — accept and apply column permission filter; block writes on view-only columns client-side.
- `src/hooks/useBoards.ts` — auto-grant creator access on `createBoard`.
- All `src/components/board/cells/*.tsx` — accept `readOnly` prop and disable interactions.

### Technical notes

- Permission lookups happen once per board load and are cached in the hook; column visibility derived via `useMemo`.
- RLS policies reference the helper function (no joins on the same policied table) to prevent infinite recursion.
- Realtime not required — permissions are low-frequency changes; refetch on panel close.

