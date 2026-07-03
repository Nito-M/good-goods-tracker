## Goal
Link jobs to the existing Customers table so you can group and filter jobs by customer on both the Jobs board and the All Job Items page.

## Database
- Add `customer_id UUID` (nullable) to `jobs`, referencing `customers(id)` with `ON DELETE SET NULL`. Index it.
- Backfill: for each job with a non-empty `customer_name`, match to a customer in the same organization (case-insensitive name match) and set `customer_id`. Jobs with no match keep `customer_name` as free text.
- Keep `customer_name/email/phone/address` columns for backward compatibility and for jobs that aren't tied to a customer record.

## Jobs board (kanban)
- Add a customer selector when creating/editing a job: searchable dropdown of customers (with "None / free-text" option). Selecting one auto-fills name/email/phone/address from the customer record.
- Add a **Customer filter** control at the top of the Jobs page (multi-select or single-select dropdown of customers, plus "All" and "No customer"). Filters the columns' cards in place.
- Add a **Group by customer** toggle. When on, the board switches from status columns to customer sections; within each customer section jobs are still ordered by status/due date.

## All Job Items page
- Add the same **Customer filter** at the top (driven by the parent job's `customer_id`).
- Add a **Group by customer** toggle that renders one collapsible section per customer, showing that customer's aggregated items.

## Technical details
- Migration adds column, FK, index, and runs the name-based backfill in one step. GRANTs unchanged (jobs table already granted).
- Update `src/types/job.ts` (`customerId: string | null`), `src/hooks/useJobs.ts` (select/map/insert/update `customer_id`), and `useAllJobItems` query to also pull `jobs.customer_id`.
- New small `CustomerPicker` component reused in Create/Edit Job dialogs, wired to `useCustomers`.
- Jobs page: add filter + group-by state (persisted to `localStorage`), render either status columns or customer sections.
- AllJobItems page: same filter + group-by pattern.
- No changes to reservation/consumption logic.

## Out of scope
- Renaming/removing the free-text customer fields.
- Per-customer sub-categories (can be a follow-up if you want tags like "Repair/Build" per customer).