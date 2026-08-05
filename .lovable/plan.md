# Packing / Delivery Slip for Sales Orders

Add a way to print a packing/delivery slip from a sales order that lists each unit being delivered with its trailer/item name, VIN, quantity, and (optionally) price.

## What you get

On the sales order detail page, a new **Packing Slip** button in the header opens a small dialog:

- Checkbox: **Include prices** (on by default; unchecked = quantities and VINs only)
- Preview of the rows that will print, so you can see which units still have no VIN
- **Download PDF** button

The slip prints one row per unit (a qty-3 line item becomes 3 rows, matching how sales order units already work), showing:

| Item / Trailer | VIN | Stock # | Job # | Qty | Unit Price | Total |

- VIN, Stock #, and Job # come automatically from the job linked to each unit. If a unit has no linked job or the job has no VIN yet, the VIN cell prints blank so it can be filled in by hand.
- Header carries the company info/logo, SO number, quote number, date, and the ship-to customer name and address (same data the sales order PDF uses).
- Footer has signature lines: Delivered By / Received By / Date.
- With prices off, the price columns and grand total are omitted entirely.

## Technical notes

- New file `src/lib/packingSlipGenerator.ts` — jsPDF generator modeled on `src/lib/quoteGenerator.ts` (same layout/logo/company-header handling, `pdfSave` for download, 2-decimal currency, dynamic row heights with text wrapping and page breaks).
- New component `src/components/PackingSlipDialog.tsx` — the include-prices toggle plus row preview, then calls the generator.
- `src/pages/SalesOrderDetail.tsx`: add the header button and dialog. It already loads `so_item_job_links` per `quote_item_id`/`unit_index`; extend that fetch (or join via `useJobs`) to pull `job_number`, `vin`, and `stock_number` for the linked jobs so the slip rows can be built without new tables.
- No database changes required.
