

## Make the Invoice/Quote Layout Editor More Realistic

### What changes
Replace the current abstract colored-box layout editor with a realistic document preview that mimics the actual PDF output. Instead of generic labeled rectangles, the canvas will show sample text content matching what the real PDF generators render -- business name, address, "INVOICE" title, sample line items in a table, totals, notes, and footer text.

### Visual Design

**Current state**: Colored rectangles with labels like "Logo", "Business Info", "Items Table" -- hard to visualize what the actual document will look like.

**New state**: A miniature A4 preview that renders:
- **Logo**: Shows the actual company logo image (or a placeholder icon if none uploaded)
- **Business Info**: Shows the real company name, address, phone, email in small text (right-aligned by default)
- **Invoice/Quote Title**: Shows "INVOICE" or "QUOTE" in large bold text
- **Invoice Details**: Shows sample "Invoice #: INV-0001", "Date: Feb 17, 2026", "Status: PENDING"
- **Bill To**: Shows "Bill To:" header with sample customer name and address lines
- **Items Table**: Shows a mini table header (Item / SKU / Qty / Price / Total) with 2-3 sample rows of grey lines
- **Totals**: Shows Subtotal, Tax, Total lines right-aligned
- **Notes**: Shows "Notes:" with sample grey text lines
- **Footer**: Shows the actual thank-you note text

All elements remain draggable. Hidden elements appear faded. The canvas keeps the same A4 proportions.

### Changes to InvoiceLayoutEditor

1. **New props**: Add `title` prop (`"Invoice Layout"` or `"Quote Layout"`), `documentType` prop (`"invoice"` or `"quote"`), plus existing `businessName`, `logoUrl`, and new props for `businessAddress`, `businessPhone`, `businessEmail`, `thankYouNote`
2. **Realistic element rendering**: Replace the simple label+icon content inside each draggable box with styled miniature content that matches the PDF:
   - Use tiny font sizes (5-7px) and proper text hierarchy
   - Show actual company data where available
   - Render sample table rows as thin grey bars for the items table
   - Show the real thank-you note in the footer
3. **Slightly reduce scale**: Keep 2x scale (420x594px) but ensure elements render proportionally to the real PDF
4. **Remove element color borders in favor of subtle dashed outlines** that only appear on hover or when selected, keeping the preview clean
5. **Keep visibility toggles panel** on the side with the same functionality

### Changes to CompanyDetail.tsx

- Pass additional props to `InvoiceLayoutEditor`: `documentType`, `businessAddress`, `businessPhone`, `businessEmail`, `thankYouNote`
- For invoice section: pass `documentType="invoice"` and `thankYouNote={invoiceThankYouNote}`
- For quote section: pass `documentType="quote"` and `thankYouNote={quoteThankYouNote}`

### Technical Details

**Files to modify:**
- `src/components/InvoiceLayoutEditor.tsx` -- major rewrite of element rendering
- `src/pages/CompanyDetail.tsx` -- pass new props to layout editors

**No database changes needed.**

The draggable element content will be rendered using small React elements inside each positioned div. The company logo will use an `<img>` tag with `object-contain`. Sample data (item rows, addresses) uses placeholder grey text. Real company data (name, address, phone, email, thank-you note) is shown where available, making the preview actually useful for seeing how the final document will look.

