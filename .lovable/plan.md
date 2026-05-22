In `src/components/sale/LinkedDocumentsCard.tsx`, remove the status filter so converted quotes (status=`sales_order`) appear in **both** pickers:

- `quoteOptions` → all quotes (no filter), labeled by `quoteNumber`.
- `salesOrderOptions` → only `status==='sales_order'`, labeled by `salesOrderNumber || quoteNumber`.

Result: QUO-0013 (now also SO-0001) shows in the Quote picker as "QUO-0013" and in the Sales Order picker as "SO-0001".