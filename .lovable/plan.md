## Add Quote / Sales Order links on Invoice Details

### Database
Add two nullable columns to `sales`:
- `linked_quote_id uuid` (references `quotes.id`, on delete set null)
- `linked_sales_order_id uuid` (references `quotes.id`, on delete set null — sales orders live in the `quotes` table with `status='sales_order'`)

Indexes on both for lookups.

### Types & hook
- `Sale` / `CreateSaleInput` (`src/types/sale.ts`) gain `linkedQuoteId` and `linkedSalesOrderId`.
- `useSales` (`src/hooks/useSales.ts`): map the two new columns on read, persist them on create/update, and add an `updateLinks(saleId, { linkedQuoteId, linkedSalesOrderId })` helper.

### Invoice Details page (`src/pages/SaleDetail.tsx`)
Add a new "Linked Documents" card under Timeline showing two rows: Quote and Sales Order.

**Auto-detected links** (read-only):
- Scan all quotes via `useQuotes` for any whose `linkedInvoices` includes this sale's id → show them as clickable badges that navigate to `/quotes` (or `/sales-orders` if status is `sales_order`) with the relevant id.

**Manual links** (editable):
- For each of the two slots, show the currently linked quote/sales order as a clickable badge with an "x" to unlink.
- An "Add link" button opens a Combobox/Command dialog listing quotes (filtered by status: quotes for the Quote slot, `sales_order` status for the Sales Order slot), searchable by number and customer name. Selecting one saves via `updateLinks`.
- Auto-detected items already attached via `linkedInvoices` are shown with a small "auto" tag and cannot be removed from the invoice side.

### Notes
- Links are display-only metadata — they don't change totals or trigger any business logic.
- No PDF changes.
- No changes to the Edit Sale dialog in this pass (linking happens from the details page as requested).