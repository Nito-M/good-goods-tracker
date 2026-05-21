## Plan to fix the board PDF logo

The board PDF is currently only passing `profile.logoUrl`, but your active logo appears to be stored on the default company record, not necessarily on the profile. The logo bucket is also private, so public-style URLs can fail when the PDF generator tries to fetch them.

### Changes I’ll make

1. **Use the correct logo source on Boards**
   - Load companies in `BoardDetail.tsx`.
   - Prefer the default company logo when available.
   - Fall back to the profile logo if no default company logo exists.

2. **Make PDF logo loading private-storage safe**
   - Update `boardPdfGenerator.ts` so logo URLs are loaded with a more reliable image path.
   - If direct `fetch()` fails, fall back to an `Image` element with `crossOrigin='anonymous'`, then convert it to a PDF-safe data URL.
   - Preserve transparency where possible instead of forcing every logo onto a white JPEG background.

3. **Add a visible fallback/debug signal**
   - If the logo still cannot load, show a small toast/console warning so it’s clear whether the issue is “no logo selected” vs “logo URL failed to load”.

### Expected result

When you click **Boards → Actions → Download PDF**, the PDF header should use the same logo you already use for invoices/quotes/POs, including the default company logo.