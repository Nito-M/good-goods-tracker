## Plan

1. **Stop relying on the stored signed URL**
   - Use each board file’s `storage_path` as the primary source for PDF export.
   - Generate a fresh signed URL at export time for every image, even if `file_url` is missing, expired, or blocked.

2. **Make `.webp` photos PDF-safe**
   - Decode the image through the browser, draw it to a canvas, and convert it to JPEG/PNG before adding it to the PDF.
   - Keep the existing fallback paths, but add stronger logging when an image cannot be decoded.

3. **Ensure the photo gets table space**
   - Reserve a fixed image area in Files-column cells so the picture has room to render instead of being clipped out.
   - If an image is too tall, scale it down to fit the PDF cell instead of skipping it.

4. **Add a visible fallback in the PDF**
   - If an image still cannot load, show the file name in that cell instead of leaving it blank.

5. **Verify on the current board**
   - Export the board currently at `/boards/95f5ca6f-a724-48e3-b817-bc364d1b9d44` and confirm `blawicoup038.webp` appears in the PDF.

## Technical details

- Update `src/lib/boardPdfGenerator.ts` to preload images from fresh signed URLs and remove the `f.file_url` gate.
- Update the PDF cell rendering so images are scaled to the actual cell width/height and are not skipped when the original dimensions exceed the row height.
- If needed, update `src/hooks/useBoardCellFiles.ts` so `refreshSignedUrl` can resolve from `storage_path` consistently for PDF generation.