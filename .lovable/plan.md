
# Add Customer Dropdown to Job Create/Edit Dialogs

## Overview
Add a dropdown at the top of the "Customer Details" section in both the Create and Edit Job dialogs. When a saved customer is selected, their name, email, phone, and address auto-fill the form fields. Users can still manually type or override values.

## Changes

### File: `src/pages/Jobs.tsx`

1. **Import `useCustomers` hook** to fetch the saved customers list.

2. **Add customer selection handler**: When a customer is selected from the dropdown, populate `formCustomerName`, `formCustomerEmail`, `formCustomerPhone`, and `formCustomerAddress` with the customer's data.

3. **Create Job dialog (line ~311-318)**: Add a `Select` dropdown labeled "Select Customer" above the manual customer fields. Options include all saved customers (displayed as name + company if available). Selecting one auto-fills the fields below. A "None" option clears the selection.

4. **Edit Job dialog (line ~349-356)**: Add the same customer dropdown above the manual fields.

5. **Reset the selected customer** when opening the create dialog (in `openCreate`).

### No database or hook changes needed
The `useCustomers` hook already exists and returns the customer list. The `customers` table is already set up.
