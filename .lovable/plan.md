## Goal
Allow each invoice line item to have its own % discount, applied **in addition** to the existing invoice-wide discount.

## How calculations will work
For each line item:
- `lineSubtotal = quantity * unitPrice`
- `lineDiscount = lineSubtotal * (itemDiscountRate / 100)`
- `lineTotal = lineSubtotal - lineDiscount`

Then invoice totals:
- `subtotal = sum(lineTotal)` (after per-item discounts)
- Invoice-wide discount % applies on top of that subtotal (unchanged behavior)
- Tax applies after invoice-wide discount (unchanged)

## Database
- Add `discount_rate NUMERIC DEFAULT 0` and `discount_amount NUMERIC DEFAULT 0` to `sale_items`.

## Backend / hooks (`src/hooks/useSales.ts`)
- Accept `discountRate` per item in create / update inputs.
- Compute each line's discount and persist `discount_rate` + `discount_amount`.
- Use post-item-discount totals when computing sale subtotal, profit, and totals.
- Map new columns into `SaleItem`.

## Types (`src/types/sale.ts`)
- Add `discountRate` and `discountAmount` to `SaleItem`.
- Add `discountRate` to the item entry in `CreateSaleInput.items`.

## UI — invoice editor (`src/pages/Sales.tsx` create form + `src/components/EditSaleDialog.tsx`)
- Add a small `Disc %` input next to each line item's qty / unit price.
- Show per-line discounted total in the row.
- Keep the existing invoice-wide discount field; show it as "Additional discount".
- Totals breakdown shows: Subtotal (after item discounts) → Additional discount → Tax → Total.

## Display surfaces
- `SaleCard.tsx`: no change required (only shows totals), but show "(incl. item discounts)" hint if any item has a discount — optional polish.
- `SaleDetail.tsx`: in the line items list, show the discount % and discounted line total when > 0.
- `invoiceGenerator.ts` (PDF): add a `Disc %` column (only when any item has a discount, to keep PDFs clean for users who don't use it), and show line totals as discounted values. Adjust column widths.

## Out of scope
- No changes to quotes, POs, sales orders, or storefront.
- No change to the invoice-wide discount semantics.
- No new RLS or auth changes.
