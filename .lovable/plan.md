

## Multi-Company Support for Invoices, POs, and Quotes

### What it does
Allows users to create and manage multiple companies in Settings. When generating an Invoice, Purchase Order, or Quote, users can select which company's details to use. The selected company's name, address, phone, email, business number, and logo will appear on the generated PDF.

### Database Changes

**New `companies` table**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| name | text | Company name |
| address | text | Nullable |
| phone | text | Nullable |
| email | text | Nullable |
| business_number | text | Nullable |
| logo_url | text | Nullable |
| is_default | boolean | Default false -- one company can be the default |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

RLS policies following the existing pattern (user owns data, org members can view).

**Migration of existing data**: A migration will copy the current profile business info into a new company record so users don't lose their existing setup.

**New columns on existing tables**:
- `sales.company_id` (uuid, nullable, FK to companies)
- `purchase_orders.company_id` (uuid, nullable, FK to companies)
- `quotes.company_id` (uuid, nullable, FK to companies)

### UI Changes

**1. Settings -- new "Companies" tab**
- List of user's companies with add/edit/delete
- Each company card shows name, address, phone, email, business number
- Logo upload per company
- Ability to set one as default
- The existing "Invoice" tab business info section will remain but show a note that company-level info is now managed in the Companies tab

**2. Invoice/Sale creation (EditSaleDialog)**
- Add a company selector dropdown at the top
- Defaults to the user's default company (or first company)
- Selected company_id is saved with the sale

**3. Purchase Order creation (AddPurchaseOrder / EditPurchaseOrderDialog)**
- Add a company selector dropdown
- Selected company_id is saved with the PO

**4. Quote creation (EditQuoteDialog)**
- Add a company selector dropdown
- Selected company_id is saved with the quote

**5. PDF generation**
- `invoiceGenerator.ts`, `purchaseOrderGenerator.ts`, `quoteGenerator.ts` will use the selected company's info instead of profile business info
- Falls back to profile business info if no company is selected

### New Files
- `src/hooks/useCompanies.ts` -- CRUD hook for companies
- Supabase migration for the companies table and FK columns

### Modified Files
- `src/pages/Settings.tsx` -- add Companies tab
- `src/components/EditSaleDialog.tsx` -- add company selector
- `src/pages/AddPurchaseOrder.tsx` -- add company selector
- `src/components/EditPurchaseOrderDialog.tsx` -- add company selector
- `src/components/EditQuoteDialog.tsx` -- add company selector
- `src/lib/invoiceGenerator.ts` -- use company info
- `src/lib/purchaseOrderGenerator.ts` -- use company info
- `src/lib/quoteGenerator.ts` -- use company info
- `src/types/sale.ts` -- add companyId to Sale type
- `src/types/purchaseOrder.ts` -- add companyId
- `src/types/quote.ts` -- add companyId

### Technical Details

- The existing profile business info is migrated into a default company record via a database migration
- When only one company exists, it auto-selects without requiring user action
- The company selector only appears when the user has more than one company
- PDF generators receive company info as part of the settings object, with fallback to profile-level business info for backward compatibility
- RLS policies follow the standard pattern: users CRUD their own, org members can SELECT

