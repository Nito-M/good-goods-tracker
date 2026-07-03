## Add part images to the Install & how-to print/PDF

Right now the "Print" button on `JobInstructionEdit` opens an HTML page with a Parts List table showing Item / Part # / Qty. I'll add a thumbnail image column, mirroring the boards PDF behavior (embed images inline so they print reliably).

### What changes

1. **New "Image" column** in the printed Parts List table, placed as the first column.
2. For each part linked to an inventory item, use the primary item image from `item_images` (same source as `useItemThumbnails`, which already powers the on-screen part thumbnails).
3. Parts with no linked inventory item, or no primary image, render a small empty placeholder cell so table rows stay aligned.

### How it will work (technical)

- In `handlePrint`, before opening the print window:
  - Collect `inventory_item_id`s from `parts`.
  - Query `item_images` for `is_primary = true`, then `createSignedUrls` on the `item-images` bucket (1 hour expiry) — same pattern as `useItemThumbnails`.
  - Fetch each signed URL as a blob and convert to a base64 data URL (like `boardPdfGenerator` does) so images are embedded directly in the print HTML and don't fail to load or expire mid-print.
- Update the parts table template:
  - Add `<th>Image</th>` as the first column.
  - Render `<img src="{dataUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />` in each row's first cell, or an empty `<div>` of the same size when no image exists.
- Keep the print trigger inside `window.onload` so images finish decoding before `window.print()` fires.

No database, storage, or route changes. Only `src/pages/JobInstructionEdit.tsx` is touched.
