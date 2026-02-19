
## Fix: Tags Not Saving or Displaying on Inventory Page

### Root Cause Analysis

There are two separate bugs:

**Bug 1 — Edit mode silently discards tag changes**

In `src/pages/AddItem.tsx`, the `handleSubmit` function has two branches:
- **New item** (line 249+): correctly calls `setTagsForItem(pendingTagIds)` after saving
- **Edit item** (line 228): saves vendor prices but **never calls `setTagsForItem`** — tag changes are lost on every edit

**Bug 2 — New item tag saving fails silently**

The `useItemTags` hook at the top of `AddItem.tsx` is initialized as `useItemTags(editItem?.id)`. For a new item, `editItem` is `null`, so `itemId` is `undefined`. When the new item is saved and `setTagsForItem(pendingTagIds)` is called, the hook's internal guard (`if (!user || !itemId) return`) immediately exits without saving anything — tags are silently dropped.

---

### The Fix

**File: `src/pages/AddItem.tsx`**

**Fix 1 — Edit mode:** Add a call to `setTagsForItem(pendingTagIds)` inside the edit branch of `handleSubmit`, after the vendor price updates.

**Fix 2 — New item mode:** The `setTagsForItem` function inside `useItemTags` uses the `itemId` from its hook closure. Since the hook is initialized before the new item's ID exists, we cannot use it for new items. Instead, we need to call `setTagsForItem` on a **separate hook instance** initialized with the new item's ID after save, OR directly use the Supabase client inline to insert tags for the new item ID after save.

The cleanest fix is to insert tags inline for new items (using supabase directly in the submit handler with the returned `newItemId`), bypassing the hook's closure limitation. For edit mode, we can safely call the hook's `setTagsForItem` since `editItem?.id` is known upfront.

---

### Technical Changes

**`src/pages/AddItem.tsx`**

1. Import `supabase` and `useAuth` so we can insert tags directly for new items
2. In the **edit branch** of `handleSubmit`: add `await setTagsForItem(pendingTagIds)` after vendor price updates
3. In the **new item branch** of `handleSubmit`: replace the broken `setTagsForItem(pendingTagIds)` call (which uses `undefined` as itemId) with a direct supabase insert using `newItemId`

```
// For new item — direct insert bypasses the undefined-itemId issue:
if (pendingTagIds.length > 0) {
  await supabase.from('item_tags').insert(
    pendingTagIds.map((tagId) => ({
      item_id: newItemId,
      tag_id: tagId,
      user_id: user.id,
    }))
  );
}
```

No database migrations needed — the `item_tags` table and all RLS policies already exist.
