

## Plan: Replace Edit Quote Dialog with Full Creation Screen

### Problem
Currently, editing a quote opens a basic `EditQuoteDialog` modal with simple text inputs — no searchable inventory picker, no assembly type selection, no full-screen item picker. The creation flow has all these features but they're lost when editing.

### Approach
Instead of the dialog, clicking "Edit" on a quote will populate the existing "New Quote" tab with the quote's data (items, vendor, rates, notes, etc.) and switch to that tab — essentially turning it into an edit mode. A save will call `updateQuote` instead of `createQuote`.

### Changes

**File: `src/pages/Quotes.tsx`**

1. **Add edit mode state**: `editingQuoteId` (string | null) to track if we're editing vs creating.
2. **When `onEdit` is triggered** (from QuoteCard): populate all creation state (`cart`, `selectedVendorId`, `taxRate`, `discountRate`, `markupPercent`, `notes`, `paymentTerms`, `validUntil`, `customQuoteNumber`, `selectedCompanyId`, `hidePrices`) from the quote's data, set `editingQuoteId`, and switch `activeTab` to `'new-quote'`.
3. **Update the submit handler**: if `editingQuoteId` is set, call `updateQuote` with the existing quote ID instead of creating a new one. After save, clear `editingQuoteId` and reset form.
4. **Update tab label**: show "Edit Quote" instead of "New Quote" when in edit mode.
5. **Remove `EditQuoteDialog`** component usage and import (the file can remain but won't be used).

**File: `src/components/EditQuoteDialog.tsx`** — No changes needed (just unused).

### Technical Details
- Quote items map to cart items: `quoteItem → { id, inventoryItemId, itemName, sku, quantity, quantityUnit, unitPrice, unitCost, notes, excludeMarkup }`
- The existing `FullScreenItemPicker` and all search/assembly features remain available since they operate on the shared `cart` state
- The "New Quote" tab heading and submit button text change contextually based on `editingQuoteId`

