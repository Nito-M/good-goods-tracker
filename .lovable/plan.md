

## Problem: Drag-and-drop image/DXF save silently fails

### Root Cause

The image **is** being uploaded to storage successfully (confirmed by checking storage objects -- multiple uploads exist). The issue is that the **database update to save the image path on the part record is blocked by Row-Level Security (RLS)**.

The part `487378f4-...` is owned by user `4d85f345-...`, but the currently logged-in user is `394d8f2a-...`. They are in the same organization (`75dd563f-...`), and the SELECT policy allows viewing via `users_share_org()`, but the **UPDATE policy only allows `auth.uid() = user_id`** -- meaning only the original creator can edit.

The `updatePart` function in `useParts.ts` does not check the Supabase response for "zero rows updated" -- it only checks for an explicit error. Since RLS silently returns success with 0 rows affected, the code thinks it worked.

### Plan

1. **Database migration**: Update the RLS UPDATE policy on the `parts` table to allow org members to update parts (matching the user's preference and consistent with assemblies/quotes which already allow org-wide editing):

```sql
DROP POLICY "Users can update their own parts" ON public.parts;
CREATE POLICY "Org members can update parts" ON public.parts
  FOR UPDATE TO authenticated
  USING (users_share_org(auth.uid(), user_id))
  WITH CHECK (users_share_org(auth.uid(), user_id));
```

Also update the DELETE policy for consistency:
```sql
DROP POLICY "Users can delete their own parts" ON public.parts;
CREATE POLICY "Org members can delete parts" ON public.parts
  FOR DELETE TO authenticated
  USING (users_share_org(auth.uid(), user_id));
```

2. **Code fix in `useParts.ts`**: After `updatePart` calls `.update().eq('id', id)`, add a check that the response actually updated a row. If `count === 0` and no error, show a "Permission denied" toast so failures aren't silent.

### Why the inline "Save" button also fails
The inline Save button calls the same `handleSave` function, which calls `uploadPartImage` (succeeds) then `updatePart` (silently blocked by RLS). The toast says "Part updated" because `updatePart` returns `true` since there's no explicit error -- but the row wasn't actually modified.

