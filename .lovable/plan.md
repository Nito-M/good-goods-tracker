

## Plan: Add Assembly Type Filter in Quotes Picker

### Summary
When clicking "Assemblies" in the quote item picker, instead of showing all assemblies in a flat list, add a type selector so users must first choose an assembly type, then see only assemblies of that type.

### Changes

**File: `src/components/FullScreenItemPicker.tsx`**

1. Add a `selectedAssemblyType` state (default: `null`).
2. Derive unique assembly types from the `assemblies` prop.
3. When `showAssemblies` is true and no type is selected, show a grid/list of assembly type cards (similar to AssemblyTypes page) instead of the assembly table.
4. When a type is selected, filter assemblies by that type and show the existing table with a back button to return to type selection.
5. Reset `selectedAssemblyType` to `null` when toggling assemblies off or closing the picker.

### Technical Details
- Extract unique types: `[...new Set(assemblies.map(a => a.type || 'General'))]`
- The Assembly interface in FullScreenItemPicker needs a `type` field added (it's already on the data from `useAssemblies`)
- Type selection view: simple clickable cards showing type name and assembly count
- Back navigation: a button/breadcrumb above the filtered assembly table to go back to type list

