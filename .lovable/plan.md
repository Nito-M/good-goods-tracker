

## Add Save Button for Vendor Pricing

### Problem
Vendor prices on items only save when the entire item form is submitted. If you add a vendor and forget to click "Save Changes", the vendor pricing is lost. Additionally, for new items, vendor prices can't be saved at all since the item ID doesn't exist yet.

### Solution
Add a visible "Save Vendor Prices" button inside the Vendor Pricing section that saves immediately when clicked, giving clear feedback that vendor data has been persisted.

### Changes

**1. `src/components/ItemVendorPricing.tsx`**
- Add a "Save" button that appears when there are unsaved changes (new vendors added, prices changed, or vendors removed)
- Accept new props: `onSave` callback and `isSaving` loading state
- Track dirty state by comparing current entries against existing prices

**2. `src/pages/AddItem.tsx`**
- When editing: wire up the save button to immediately call `upsertPrice`/`deletePrice` for changed vendor prices without requiring the full form submit
- The full form submit will still also save vendor prices (no change to existing behavior)
- When creating a new item: show a message that vendor prices can be added after saving the item

### Technical Details

In `ItemVendorPricing.tsx`, add:
- A new `onSave?: () => Promise<void>` prop
- A `isSaving?: boolean` prop  
- A "Save Vendor Prices" button rendered at the bottom of the vendor list when `onSave` is provided
- The button shows a spinner when saving

In `AddItem.tsx`, add a handler:
- `handleSaveVendorPrices` that loops through `vendorPrices`, calls `upsertPrice` for each, deletes removed ones, and shows a toast on success
- Pass this handler to `ItemVendorPricing` as the `onSave` prop (only in edit mode)

