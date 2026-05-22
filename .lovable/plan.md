## Problem

All 21 invoices currently marked **paid** have `paid_at = NULL` in the database, so the invoice detail Timeline shows "Paid: —". The code that records `paid_at` (in `useSales.updateStatus`) is correct and runs whenever status is changed to `paid` going forward — but these existing rows were marked paid before that logic captured the timestamp (or via another path), so the column was never populated.

The UI itself already displays the paid date correctly (`SaleDetail.tsx` Timeline row "Paid" reads `sale.paidAt`); there's nothing to fix in the component.

## Fix

Run a one-time data backfill: for every sale where `status = 'paid'` and `paid_at IS NULL`, set `paid_at = updated_at`. The `updated_at` column is the closest available approximation of when the status was flipped to paid.

```sql
UPDATE public.sales
SET paid_at = updated_at
WHERE status = 'paid' AND paid_at IS NULL;
```

This affects 21 rows. After it runs, the SaleDetail Timeline will show a Paid date for each of them, and any newly-marked-paid invoices will continue to capture the real timestamp via the existing code path.

## Notes

- No code changes required.
- If you'd rather show "—" instead of a guessed date for these historical records, we can skip the backfill — but every existing paid invoice will keep showing no paid date.
