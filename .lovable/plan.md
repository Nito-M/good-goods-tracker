## Plan: Remove Requesters card from Settings

The Requesters management UI in **Settings → General** (Settings.tsx, lines 742–805) is the old per-profile `requesterNames` list. The Requests page already has the newer org-wide `RequestersManager` (used in `Requests.tsx` line 688), so this card is redundant.

### Changes — `src/pages/Settings.tsx`
1. Delete the `<Card>` block (lines ~742–805) containing "Requesters".
2. Remove the now-unused state and initializers:
   - `requesterName`, `setRequesterName`
   - `requesterNames`, `setRequesterNames`
   - `newRequesterName`, `setNewRequesterName`
   - The two lines in the profile load effect that hydrate `requesterName`/`requesterNames` from `profile`.
3. Drop any imports that become unused as a result (only if exclusively used here).

### Out of scope
- The org-level `org_requesters` table and `RequestersManager` on the Requests page stay as-is.
- No DB / profile schema changes — `profile.requesterNames` is left untouched in case other code reads it (will verify during implementation and clean up only if fully unused).
