

## Fix: Make Only the Assembly List Scroll (Not the Header)

### Problem
On the Assemblies page (`/assemblies/Trailers`), the entire content area scrolls together -- including the header (type name, Import CSV, + New buttons, search bar). Only the assembly cards list should scroll while the header stays pinned at the top.

### Root Cause
The outer container and sidebar structure should constrain height properly, but the combination of `h-full` with the AppLayout's `overflow-hidden` main area may not resolve correctly on all viewports. The fix is to ensure the sidebar's inner list is the only scrollable region.

### Changes

**`src/pages/Assemblies.tsx`**

1. On the outer wrapper (line 413), change from `h-full` to `h-[calc(100vh-theme(spacing.14))] md:h-[calc(100vh-theme(spacing.12))]` to give it an explicit calculated height accounting for the AppLayout headers (mobile: 56px / desktop: 48px). Alternatively, a simpler approach: ensure the flex column layout uses proper constraints.

2. Actually the simplest fix: the outer `div` at line 413 already has `flex h-full overflow-hidden flex-col` and the sidebar at line 427 has `flex flex-col overflow-hidden`. The list at line 442 has `flex-1 overflow-auto`. This chain should work -- but `h-full` may not resolve if the parent doesn't have explicit height. The fix is to add `min-h-0` to the flex-1 inner container (line 424) so the flex child can shrink below its content size, enabling overflow to kick in.

**Specific edits:**
- Line 424: Add `min-h-0` to the inner flex container: `"flex flex-1 overflow-hidden min-h-0"`
- Line 427: Ensure sidebar div has `min-h-0`: `"w-96 shrink-0 border-r flex flex-col bg-sidebar overflow-hidden min-h-0"`

This ensures the flex children properly shrink, allowing `overflow-auto` on the list (line 442) to activate and scroll independently while the header with buttons stays fixed.

