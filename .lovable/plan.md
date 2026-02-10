

## Fix: Enable Deletion of Items, Requests, and Purchase Orders

### Problem Identified

There are three separate issues preventing deletions:

1. **Requests**: Non-admin users cannot delete, edit, or change status on requests because the UI only enables these actions for admins (org admin or super admin). Even admins may fail if viewing requests created by other org members, since the database only allows users to delete their own records.

2. **Items**: The application code blocks item deletion when the item's SKU appears on any unreceived Purchase Order. This is an intentional safety check, but it may be too restrictive if you want to force-delete items.

3. **Purchase Orders**: Database security policies only allow users to delete their own POs. Org admins viewing POs created by other members cannot delete them because the policy checks `auth.uid() = user_id`.

---

### Plan

#### 1. Allow Admins to Delete Any Org Member's Records (Database)

Add new RLS policies so org admins can delete records belonging to members of their organization:

- **`requests`** table: Add DELETE policy for org admins using `users_share_org()`.
- **`purchase_orders`** table: Add DELETE policy for org admins using `users_share_org()`.
- **`inventory_items`** table: Add DELETE (soft-delete via UPDATE) policy for org admins using `users_share_org()`. (Already has an UPDATE policy for own records; need org admin UPDATE policy.)

#### 2. Fix Request Card Permissions (Frontend)

Update `src/pages/Requests.tsx` so that:
- Admin users retain full control (delete, edit, status change) -- already working.
- Non-admin users can delete and edit **their own** requests (where `requesterName` matches their linked name).
- Pass `onDelete` and `onEdit` conditionally per-card, or always pass them and let the database enforce permissions.

#### 3. Relax Item Deletion Check (Frontend)

Update `src/hooks/useInventory.ts` to either:
- Remove the unreceived-PO check entirely, or
- Show a warning but still allow deletion if the user confirms.

This means changing the `deleteItem` function so the PO check becomes a warning rather than a hard block.

#### 4. Add Org Admin UPDATE/DELETE Policies (Database Migration)

```sql
-- Allow org admins to update org members' inventory items (for soft-delete)
CREATE POLICY "Org admins can update org inventory"
  ON inventory_items FOR UPDATE
  USING (users_share_org(auth.uid(), user_id));

-- Allow org admins to delete org members' purchase orders
CREATE POLICY "Org admins can delete org purchase orders"
  ON purchase_orders FOR DELETE
  USING (users_share_org(auth.uid(), user_id));

-- Allow org admins to delete org members' requests
CREATE POLICY "Org admins can delete org requests"
  ON requests FOR DELETE
  USING (users_share_org(auth.uid(), user_id));

-- Allow org admins to update org members' requests (for status changes)
CREATE POLICY "Org admins can update org requests"
  ON requests FOR UPDATE
  USING (users_share_org(auth.uid(), user_id));
```

---

### Technical Details

#### Files to modify:
- **Database migration** (new): Add RLS policies for org admin delete/update on `requests`, `purchase_orders`, and `inventory_items`.
- **`src/pages/Requests.tsx`**: Pass `onDelete` and `onEdit` for all users (not just admins), so regular users can manage their own requests.
- **`src/hooks/useInventory.ts`**: Change `deleteItem` to warn about unreceived POs instead of blocking deletion. Show a confirmation toast but proceed if the user already confirmed.

#### Files unchanged:
- `src/hooks/usePurchaseOrders.ts` -- delete logic is fine; the fix is at the database RLS level.
- `src/hooks/useRequests.ts` -- delete logic is fine; the fix is at the database RLS level and UI level.

