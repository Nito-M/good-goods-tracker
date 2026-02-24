

# Tax Documents Page

A new page that aggregates all uploaded PDFs and images across Purchase Orders and Invoices (Sales) into one centralized view for tax purposes.

## What You'll Get

- A new "Tax Documents" page accessible from the sidebar
- All PO attachments (images and PDFs), PO receipt images, and PO PDF files shown in one place
- All Invoice/Sale records listed with the ability to download their generated PDF
- Filterable by year to easily find documents for a specific tax period
- Each document shows its reference number (PO-XXXX or INV-XXXX), vendor name, date, and a thumbnail/icon

## Data Sources

The page will pull from:
1. **Purchase Orders** -- `pdf_url`, `image_url` fields, plus all records from the `po_attachments` table (multi-file attachments)
2. **Sales (Invoices)** -- Each sale record (invoices are generated on-the-fly as PDFs, so the page will list them with a "Download PDF" action using the existing invoice generator)

## Technical Details

### New Files
1. **`src/pages/TaxDocuments.tsx`** -- Main page component
   - Fetches all purchase orders (reuses `usePurchaseOrders`) and sales (reuses `useSales`)
   - Displays a grid of document cards grouped by type (POs / Invoices)
   - Year filter dropdown (defaults to current year)
   - Each card shows: document type icon, reference number, vendor, date, amount, and a clickable thumbnail or download link
   - Clicking an image opens the existing `ImageViewerDialog`
   - Clicking a PDF opens it in a new tab (signed URL)

### Modified Files
2. **`src/components/AppSidebar.tsx`** -- Add "Tax Documents" menu item with a `FileText` icon
3. **`src/App.tsx`** -- Add route `/tax-documents` pointing to the new page

### No database changes needed
All data already exists in the current tables.
