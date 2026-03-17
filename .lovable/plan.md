

## Problem

When you change a request's status (e.g., pending → approved), the current request gets filtered out of the navigation list because `allRequestNumbers` only includes requests matching the original status. Since the current request now has a different status, `currentIndex` becomes `-1`, breaking prev/next navigation.

## Fix

In the `allRequestNumbers` memo, always include the current `decodedNumber` in the navigation list regardless of its current status. This way, after changing a request from "pending" to "approved", you still navigate through the other "pending" requests via prev/next, while remaining on the current request.

### Change in `src/pages/RequestDetail.tsx`

Update the `allRequestNumbers` `useMemo` (around line 66-76):

1. Keep filtering by `navigationStatus` as before
2. After building the sorted list, ensure `decodedNumber` is inserted at its original position if it was filtered out due to a status change

This is a single-line addition after the sorted array is built — if `decodedNumber` isn't in the list, splice it into the correct position (or simply ensure it's always included in the filter by adding `|| r.requestNumber === decodedNumber` to the condition).

