
## Allow Saving Pictures When Creating an Item

### Current Situation

When creating a new item (`/items/new`), the form shows a basic single-image uploader. The image gets stored as a URL on the `inventory_items` table (`image_url` column). Multi-image support via the `item_images` table only works in edit mode because it requires an existing item ID.

The note "Add more images after saving." confirms this limitation was known.

### Goal

Allow users to upload one or more images **while creating** a new item, with those images ending up in the proper `item_images` gallery table.

---

### How It Will Work

The approach is a two-phase save:

1. **User selects images** on the create form — images are held in local state as `File` objects (no upload yet).
2. **User clicks "Add Item"** — the item is saved first to get its new `id`, then the staged images are uploaded to the `item_images` table using that ID.

This requires `addItem` to **return the new item's ID**, which it currently does not.

---

### Technical Changes

**1. `src/hooks/useInventory.ts`**
- Modify `addItem` to return the newly created item's `id` (already generated as `dbItem.id` before the insert — just return it).

**2. `src/pages/AddItem.tsx`**
- Replace the current single-image upload section (for new items) with the same `MultiImageUploader` component used in edit mode.
- Add a `pendingImageFiles` state (`File[]`) to hold staged files locally.
- Create a lightweight wrapper that mimics the `ItemImage` shape for preview purposes using `URL.createObjectURL`, so the uploader can show thumbnails before the item is saved.
- On form submit (`handleSubmit`):
  - Call `onSave(itemData)` and receive back the new item ID.
  - Loop through `pendingImageFiles` and call `uploadItemImageToGallery(file, isPrimary)` for each, using the real `useItemImages` hook initialized with the new item ID.
- Since `useItemImages` needs an `itemId` to upload, the upload step happens post-save using the returned ID.

**3. `src/components/MultiImageUploader.tsx`** (minor tweak)
- The uploader currently calls `onUpload(file)` which triggers the actual DB/storage upload. For the create flow, we need it to **stage** files instead of uploading immediately.
- Add an optional `stagingMode` prop. When true, `onUpload` is replaced by a local staging handler that adds `File` objects to an array and shows previews using object URLs. Delete removes from staged array.

**4. `src/App.tsx`**
- Update the `AddItemPage` route to pass the `addItem` return value properly (the `onSave` prop). The `AddItemPage` `onSave` prop type will need to change to `() => Promise<string | null>` or similar so the ID can be passed back.

---

### User Experience

- On `/items/new`, the "Product Images" section will show the full multi-image upload widget (same as edit mode).
- Users can add multiple photos before clicking "Add Item."
- Preview thumbnails appear immediately.
- On save, images upload in sequence and are attached to the new item automatically.
- After saving, the user is navigated to `/items` as before.
- A toast will confirm success.

---

### Summary of File Changes

| File | Change |
|---|---|
| `src/hooks/useInventory.ts` | Return new item ID from `addItem` |
| `src/pages/AddItem.tsx` | Stage files locally; upload after item is created |
| `src/components/MultiImageUploader.tsx` | Add `stagingMode` prop for pre-save previews |
| `src/App.tsx` | Ensure `onSave` callback handles returned ID |

No database migrations are needed — the `item_images` table already exists and supports this use case.
