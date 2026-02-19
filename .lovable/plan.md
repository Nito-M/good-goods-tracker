
# Fix: Item Creation - Images Not Saving & Redirect to Edit Page

## Root Cause Analysis

Two distinct bugs were found in `src/pages/AddItem.tsx`:

### Bug 1: Images Not Uploading on Create

The `useItemImages` hook is called at component mount time with `useItemImages(editItem?.id)`. When creating a new item, `editItem` is `null`, so the hook receives `undefined` as the `itemId`. The `uploadImage` function inside the hook has an early guard: `if (!itemId || !user) return null;`. This means when the staged images are uploaded after the item is created (the new `newItemId` is returned), the hook's internal `itemId` is still `undefined` — it was captured at initialization and does not update.

**Fix**: Instead of relying on the `useItemImages` hook's `uploadImage` function (which is bound to an undefined `itemId`), the image upload for create mode needs to call the upload function with the correct new item ID. The solution is to create a direct upload helper that accepts an `itemId` parameter, or to call the upload directly using the Supabase client with the returned `newItemId`.

The cleanest fix is to add an `uploadImageForItem` function to `useItemImages` that accepts an explicit `itemId` as a parameter alongside the file, bypassing the stale closure issue.

### Bug 2: Redirect Goes to Edit Page Instead of Items List

In `handleSubmit` (line 263 of `AddItem.tsx`), after a new item is saved, the code navigates to `/items/edit/${newItemId}`. The user expects to be returned to the items list (`/items`) after creating an item.

**Fix**: Change `navigate(`/items/edit/${newItemId}`)` to `navigate('/items')`.

## Files to Change

### `src/hooks/useItemImages.ts`
- Add a new exported function `uploadImageForItem(itemId: string, file: File, isPrimary: boolean)` that accepts an explicit `itemId` so it can be called after the new item ID is known.

### `src/pages/AddItem.tsx`
- Import and use the new `uploadImageForItem` function (which accepts `itemId`) when uploading staged images after creation.
- Change `navigate(`/items/edit/${newItemId}`)` to `navigate('/items')` so users return to the items list after creation.

## Technical Detail

```text
Current flow (broken):
  1. useItemImages(undefined) — itemId is undefined at mount
  2. User stages images
  3. onSave() returns newItemId
  4. uploadItemImageToGallery(file, isPrimary) is called
     → internally checks: if (!itemId || !user) return null  ← exits early!
  5. Images are silently lost
  6. navigate(`/items/edit/${newItemId}`) — goes to edit page

Fixed flow:
  1. useItemImages(undefined) — still undefined at mount (fine)
  2. User stages images  
  3. onSave() returns newItemId
  4. uploadImageForItem(newItemId, file, isPrimary) is called
     → uses the fresh newItemId directly — uploads succeed
  5. navigate('/items') — returns to items list
```

No database schema changes required. This is a purely frontend fix.
