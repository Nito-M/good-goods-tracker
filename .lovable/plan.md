

## Make Assembly Sidebar List Scroll Independently

The assembly list (left panel) currently scrolls with the entire page. The fix ensures only the list of assemblies scrolls, keeping the header/breadcrumb and search bar fixed in place.

### Root Cause

The `<main>` element in `AppLayout.tsx` has `overflow-auto`, which creates a page-level scrollbar. The Assemblies page sets `h-full` on its container, but the main's own scrolling prevents the inner flex layout from properly constraining the sidebar height.

### Changes

**`src/components/AppLayout.tsx`** (line 97)
- Change main from `overflow-auto` to `overflow-hidden` so child pages fully control their own scrolling. This forces each page to manage its own scroll areas rather than relying on page-level scroll.

This single change lets the existing flex layout in `Assemblies.tsx` work as intended -- the sidebar's list area (`flex-1 overflow-auto` on line 442) will scroll independently while the breadcrumb, search bar, and right panel remain fixed.

### Impact on Other Pages

Pages that rely on page-level scrolling will need their own scroll wrapper. Most pages already have their own `overflow-auto` containers, but if any page breaks, it can be fixed by adding `overflow-auto` to that page's root element.

