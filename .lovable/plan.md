

## Wire Up Company Selection for Invoices and Quotes

### Problem
When you create a sale (invoice) or quote, the company you've set up -- with its logo, name, address, phone, email -- is never actually attached to the document. The PDF always falls back to your profile-level settings, ignoring your company configurations.

### Root Causes
1. The Sales and Quotes creation forms have no company selector dropdown
2. The `company_id` is never saved when creating sales or quotes
3. The Quote type and hook don't map `company_id` at all when fetching data
4. The `CreateSaleInput` and `CreateQuoteInput` types are missing a `companyId` field

### What Will Change

**1. Add Company Selector to Sales page (`src/pages/Sales.tsx`)**
- Add a `CompanySelector` dropdown in the sale creation form (next to the vendor selector)
- Track `selectedCompanyId` state, defaulting to the default company
- Pass `companyId` when calling `createSale()`

**2. Add Company Selector to Quotes page (`src/pages/Quotes.tsx`)**
- Same as above -- add `CompanySelector` in the quote creation form
- Track `selectedCompanyId`, pass it when calling `createQuote()`

**3. Update `CreateSaleInput` type (`src/types/sale.ts`)**
- Add optional `companyId?: string | null` field

**4. Update `CreateQuoteInput` type (`src/types/quote.ts`)**
- Add optional `companyId?: string | null` field

**5. Update `useSales` hook (`src/hooks/useSales.ts`)**
- In `createSale()`: include `company_id: input.companyId` in the insert call

**6. Update `useQuotes` hook (`src/hooks/useQuotes.ts`)**
- In `createQuote()`: include `company_id: input.companyId` in the insert call
- In `fetchQuotes()`: map `company_id` to `companyId` (currently missing)

**7. Update Quote type (`src/types/quote.ts`)**
- Add `companyId?: string | null` to the `Quote` interface (for consistency with Sale)

### Result
After these changes, when you select a company while creating an invoice or quote, the PDF will show that company's logo, name, address, and contact info instead of the generic profile fallback.

### Files to Modify
- `src/types/sale.ts` -- add `companyId` to `CreateSaleInput`
- `src/types/quote.ts` -- add `companyId` to `Quote` and `CreateQuoteInput`
- `src/hooks/useSales.ts` -- save `company_id` on create
- `src/hooks/useQuotes.ts` -- save `company_id` on create, map on fetch
- `src/pages/Sales.tsx` -- add CompanySelector, track state, pass to createSale
- `src/pages/Quotes.tsx` -- add CompanySelector, track state, pass to createQuote

No database changes needed -- the `company_id` column already exists on both `sales` and `quotes` tables.

