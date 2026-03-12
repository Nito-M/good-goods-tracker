

## Plan: Restructure Item Details Layout to Match Part Details

**Goal**: Rearrange the top section of `ItemDetails.tsx` so images appear on the left and item info on the right in a two-column grid, matching the `PartDetail.tsx` layout.

### Current Layout (ItemDetails)
- Title + badges (full width)
- Storefront toggle card (full width)
- Product Images card (full width)
- DXF card (full width)
- Then 2-column grid for Pricing & Stock / Details

### Target Layout (matching PartDetail)
- Title + badges (full width, kept as-is)
- **Two-column grid**:
  - **Left column**: Product Images card (with `ItemImageGallery`)
  - **Right column**: Key details card (Pricing summary, stock status, storefront toggle, category, SKU, description)
- DXF card (full width, below the grid)
- Remaining cards below

### Changes

**File: `src/pages/ItemDetails.tsx`** (lines ~332-416)
1. After the title/badges section, replace the separate storefront card and full-width images card with a `grid grid-cols-1 md:grid-cols-2 gap-6` wrapper
2. Left side: Move the Product Images card (with `ItemImageGallery`) into the left column
3. Right side: Create a "Details" card containing:
   - Category & stock status badges
   - Selling Price / Cost
   - Quantity in Stock / Min Stock
   - Storefront toggle (moved from its own card)
4. Keep the DXF card and remaining content below the grid as-is

This mirrors the PartDetail pattern of `Image` card on left + `Details` card on right.

