

# Add Customers Tab to Settings

## Overview
Add a new "Customers" tab in the Settings page where users can manage their customer contacts (name, company, phone, address, email). This creates a reusable customer list that can later be linked to Jobs.

## Changes

### 1. Database - Create `customers` table
New table with columns:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `name` (text, NOT NULL)
- `company` (text, nullable)
- `phone` (text, nullable)
- `email` (text, nullable)
- `address` (text, nullable)
- `created_at`, `updated_at` (timestamps)

RLS policies following the existing pattern:
- Users can CRUD their own customers
- Org members can view org customers (using `users_share_org`)

### 2. Hook - `src/hooks/useCustomers.ts`
New hook following the same pattern as `useVendors` -- fetch, add, update, delete customers.

### 3. Settings UI - `src/pages/Settings.tsx`
- Add a "Customers" tab between Categories and Users
- Tab content: searchable list of customers with Add/Edit/Delete
- Add/Edit dialog with fields: Name, Company, Phone, Email, Address
- Delete confirmation dialog
- Follows the exact same UI pattern as the existing Vendors tab

### 4. Sidebar & Permissions
No changes needed -- customers are managed within the existing Settings page, which already has its own permission controls.

### Files Modified
- New migration SQL (create `customers` table + RLS)
- New: `src/hooks/useCustomers.ts`
- Modified: `src/pages/Settings.tsx` (add Customers tab)

