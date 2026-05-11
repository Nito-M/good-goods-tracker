## Problem

When you click the star on the legacy main photo (the one stored directly on the asset), it inserts a brand-new row in the gallery with the same image URL. That's why it looks like the photo got copied — the same picture now appears both as a fresh gallery thumbnail and (briefly) as the old main image.

## Fix

Revert the legacy-image starring behavior added in the previous change.

**`src/pages/AssetDetail.tsx`**
- Remove the star button from the legacy `asset.image_url` thumbnail (lines ~370–390).
- Keep the legacy thumbnail visible (and its delete button), but no longer offer "set as main" on it.
- Result: starring only works on real gallery images via `setPrimaryImage`, which simply flips the `is_primary` flag — no inserts, no copies.

**`src/hooks/useAssetImages.ts`**
- Leave `addImageByUrl` in place (still used for normal uploads via `addImage`'s flow / future use), but it will no longer be called from the legacy star button.

No database or business-logic changes. Pure UI revert.
