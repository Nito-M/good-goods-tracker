

## Move Invoice and Quote Settings into Company Settings

### What changes
Currently, invoice settings (prefix, next number, thank you note, layout) and quote settings (validity days, thank you note, layout) are stored globally in the user's profile. This plan moves those settings into each company, so different companies can have different invoice numbering, layouts, and branding.

### Database Changes

**Add columns to `companies` table:**

| Column | Type | Default |
|--------|------|---------|
| invoice_prefix | text | 'INV' |
| invoice_next_number | integer | 1 |
| invoice_thank_you_note | text | 'Thank you for your business!' |
| invoice_layout | jsonb | (default layout) |
| quote_thank_you_note | text | 'Thank you for considering our services!' |
| quote_validity_days | integer | 30 |
| quote_layout | jsonb | (default layout) |

**Data migration**: Copy existing profile-level invoice/quote settings into each user's companies so nothing is lost.

### UI Changes

**1. Company Add/Edit Dialog (CompaniesSettings.tsx)**
- Expand the dialog with collapsible sections for "Invoice Settings" and "Quote Settings"
- Invoice Settings section: prefix, next number, thank you note, layout editor
- Quote Settings section: validity days, thank you note, layout editor
- The logo already exists per company -- it will be used on documents

**2. Settings page (Settings.tsx)**
- Remove the standalone "Invoice" and "Quote" tabs entirely since all that configuration now lives inside each company
- Remove the business info fields from the Invoice tab (already in companies)
- Remove the logo upload from the Invoice tab (already in companies)

**3. PDF generation**
- Update `InvoiceSettings` type to include all the new per-company fields
- When generating invoices/POs/quotes, pull settings from the selected company instead of the profile
- Falls back to profile settings if no company is selected (backward compatibility)

### Modified Files
- Database migration (new columns on companies, data migration)
- `src/hooks/useCompanies.ts` -- add new fields to Company/CompanyInput interfaces
- `src/components/CompaniesSettings.tsx` -- expand dialog with invoice/quote settings sections
- `src/pages/Settings.tsx` -- remove Invoice and Quote tabs
- `src/types/sale.ts` -- update InvoiceSettings with layout fields
- `src/pages/Sales.tsx` -- build settings from company data
- `src/pages/PurchaseOrders.tsx` -- build settings from company data
- `src/pages/Quotes.tsx` -- build settings from company data

### Technical Details
- The company edit dialog will use collapsible/accordion sections to keep the form manageable
- The InvoiceLayoutEditor component is reused inside the company dialog
- Profile-level invoice/quote settings remain in the database for backward compatibility but are no longer editable from the UI
- When a document has no company selected, the system falls back to profile-level settings
- The `invoice_next_number` is tracked per company, so each company can have its own invoice sequence

