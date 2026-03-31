

## Plan: Switch PO Item Entry to Full-Screen Picker Style (Like Quotes/Sales)

### Summary
Replace the current inline combobox line-item entry in the PO creation page with the same `FullScreenItemPicker` + cart card pattern used in Quotes and Sales. Keep all other PO-specific sections (vendor, order details, attachments, order summary, actions) unchanged.

### Changes

**File: `src/components/FullScreenItemPicker.tsx`**
1. Add `'Purchase Order'` to the `documentType` union type so the picker can be used for POs.

**File: `src/pages/AddPurchaseOrder.tsx`**
1. **Replace LineItem model with CartItem model**: Switch from the current `LineItem` (with `selectedItemId`, `customSku`, `customName`) to a `CartItem` interface matching the picker pattern (`id`, `inventoryItemId`, `itemName`, `sku`, `quantity`, `unitCost`, `notes`).
2. **Add FullScreenItemPicker**: Import and render `FullScreenItemPicker` with `open`/`onClose` state. Add the "Add Items from Inventory" button (same style as Quotes) above the cart card.
3. **Replace the inline line-item card** with a cart display card showing added items (item name, SKU, quantity, unit cost, total, notes, delete button) -- same layout as Quotes/Sales cart items.
4. **Wire up picker callbacks**: `onAddItem` maps an inventory item to a cart entry (auto-filling vendor price if available), `onAddCustomItem` creates a blank custom entry, `onUpdateQuantity`/`onRemoveItem`/`onUpdateItem` manage the cart.
5. **Preserve vendor price logic**: When vendor changes, update unit costs on existing cart items that match vendor-priced inventory items. When an item is added from the picker, auto-fill its vendor price.
6. **Update `handleSave`**: Map `CartItem[]` to `PurchaseOrderItem[]` for the existing `createOrder`/`updateOrder` calls.
7. **Update edit initialization**: Map `editingOrder.items` to `CartItem[]` instead of `LineItem[]`.
8. **Remove**: `ItemSearchCombobox` component, `LineItem` interface, `createEmptyLineItem` function, and all inline line-item grid rendering code.

### What stays the same
- Vendor selection card (top)
- Order Details card (PO number, date, request link, jobs, bank card, notes)
- Attachments card (PDF + image upload)
- Order Summary card (subtotal, discount, tax, total)
- Action buttons (Cancel, Save as Draft, Create Order / Save Changes)
- All vendor price auto-fill business logic (just rewired to cart items)

### Technical Details
- The `FullScreenItemPicker` already supports custom items and item search -- no changes needed for that
- Cart items will include `unitCost` for PO-specific pricing (vendor prices), mapped from the picker's `unitPrice` field
- The picker's `documentType` will be `'Purchase Order'` to label UI appropriately
- Assemblies won't be included in PO picker (no `onAddAssembly` prop) since POs are for purchasing inventory

