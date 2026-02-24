

## Fix: Independent Scrolling for Assembly List

### Problem
The previous fix (adding `min-h-0`) didn't resolve the scrolling issue. The assembly list on the left (red circled area) still scrolls together with everything else. The root cause is that `h-full` on the page wrapper doesn't properly resolve height constraints through the flexbox chain, so the content grows unbounded instead of being contained.

### Solution
Replace the relative `h-full` on the outer page wrapper with an absolute viewport height calculation that accounts for the AppLayout header bars (56px on mobile, 48px on desktop). This guarantees the page container has a fixed height, making the flex children properly constrain and enabling `overflow-auto` on just the assembly list.

### Changes

**`src/pages/Assemblies.tsx`**

1. **Line 413** - Change the outer wrapper class from `h-full` to explicit viewport-based heights:
   - From: `"flex h-full overflow-hidden flex-col"`
   - To: `"flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3rem)] overflow-hidden flex-col"`
   - 3.5rem = 56px (mobile header), 3rem = 48px (desktop header)

This single change ensures the entire page is height-constrained to the viewport minus the AppLayout header. The existing `min-h-0` and `flex-1 overflow-auto` on the list (line 442) will then work correctly, making only the assembly cards scroll while the sidebar header (type name, buttons, search) and the right detail panel remain fixed.

### Why the previous fix didn't work
`h-full` resolves to 100% of the parent's height. In a flexbox layout where the parent's height is computed by `flex-1` rather than set explicitly, percentage-based heights can fail to resolve in some browsers. Using viewport units (`100vh - header`) bypasses this entirely.
