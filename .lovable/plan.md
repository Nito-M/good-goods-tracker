

## Add In-Browser Preview for POs, Invoices, and Quotes

### What it does
Adds an "eye" preview button to Purchase Order cards and Quote cards (Invoice/Sale cards already have this), opening a dialog that shows a visual representation of the document without downloading a PDF. Each preview dialog includes a "Download PDF" button for when users do want the file.

### Changes

**1. New file: `src/components/PurchaseOrderPreviewDialog.tsx`**
- A dialog that renders the PO content in an A4-style layout matching the PDF generator output
- Shows: logo, business info, PO number, dates, vendor, items table, totals (with 5% tax), notes
- Includes a "Download PDF" button
- Mirrors the structure of the existing `InvoicePreviewDialog`

**2. New file: `src/components/QuotePreviewDialog.tsx`**
- A dialog that renders the Quote content in an A4-style layout matching the PDF generator output
- Shows: logo, business info, quote number, dates, validity, vendor/"Quote For", items table (with quantity units and item notes), totals (discount + tax), notes, footer
- Includes a "Download PDF" button

**3. Modified: `src/components/PurchaseOrderCard.tsx`**
- Add an "Eye" icon preview button next to the existing Download button
- Add `onPreview` callback prop
- When clicked, opens the PO preview dialog

**4. Modified: `src/pages/PurchaseOrders.tsx`**
- Import the new `PurchaseOrderPreviewDialog`
- Add state for the preview PO (`previewOrder`)
- Pass `onPreview` handler to `PurchaseOrderCard`
- Render the preview dialog
- Build invoice settings from profile/company for the preview

**5. Modified: `src/components/QuoteCard.tsx`**
- Add an "Eye" icon preview button next to the existing Download button
- Add `onPreview` callback prop
- When clicked, opens the Quote preview dialog

**6. Modified: `src/pages/Quotes.tsx`**
- Import the new `QuotePreviewDialog`
- Add state for the preview quote (`previewQuote`)
- Pass `onPreview` handler to `QuoteCard`
- Render the preview dialog

### Technical Details

- The preview dialogs replicate the PDF layout using HTML/CSS (same approach as the existing `InvoicePreviewDialog`)
- A4 dimensions (210mm x 297mm) with 0.7 scale transform for fitting in the dialog
- Company info is resolved the same way as for PDF generation -- using the linked company or falling back to profile business info
- No database changes required
- The existing Invoice preview already works via `SaleCard` -- no changes needed there
