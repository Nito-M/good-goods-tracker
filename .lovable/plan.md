

## Plan: Handle Browser Back Button in Full-Screen Pickers

### Problem
When the full-screen parts/item picker is open inside an assembly detail view, pressing the browser back button navigates away from the assembly entirely (back to the assembly list). The user expects it to just close the picker and stay on the assembly.

### Approach
Push a temporary history entry when the full-screen picker opens, and listen for the `popstate` event to close the picker instead of navigating away. When the picker closes normally (via the Done button), remove the history entry. This applies to all three full-screen pickers used in the Assemblies page (`FullScreenPartsPicker`, `FullScreenItemPicker`, and any assembly picker).

### Changes

**`src/components/FullScreenPartsPicker.tsx`**
- When `open` becomes `true`, push a history state entry (`window.history.pushState`)
- Add a `popstate` event listener that calls `onClose(cart)` when back is pressed
- On normal close (Done button), call `window.history.back()` instead of directly calling `onClose`, so the pushed state is consumed
- Clean up the listener when the component unmounts or closes

**`src/components/FullScreenItemPicker.tsx`** (if used in Assemblies)
- Same pattern: push history state on open, listen for popstate, clean up on close

This is a contained change to the picker components — no routing or page-level changes needed.

