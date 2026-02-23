

# Add Total Amount Per Status Tab on Requests Page

## What Changes

Add a dollar total next to each status tab badge showing the sum of all request totals in that status. This gives a quick financial overview of how much money is in each pipeline stage.

## How It Works

The total for each request is calculated as:
`(quantity x price) + GST + extra cost`

This same formula already exists in `RequestCard.tsx`. We'll replicate it in the Requests page to compute a sum per status.

## Technical Detail

**File: `src/pages/Requests.tsx`**

1. Import `formatCurrency` from `@/lib/utils`
2. Add a helper function to calculate a single request's total:
   ```text
   subtotal = quantity * price
   gst = subtotal * (gstRate / 100)
   total = subtotal + gst + extraCost
   ```
3. Add a `getStatusTotal(status)` function that sums all visible requests matching that status
4. Display the formatted total below or next to the count badge in each tab trigger, e.g. showing "$1,234.56" as smaller text beneath the status label

The total will appear as a subtle secondary line in each tab, so users can see at a glance how much money each status represents.

