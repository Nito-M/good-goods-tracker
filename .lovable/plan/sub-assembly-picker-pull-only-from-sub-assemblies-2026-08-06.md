# Sub Assembly picker: pull only from Sub Assemblies

On an assembly's detail view, "Add from → Sub assembly" currently lists two sections: **Sub Assemblies** (the Parts > Sub Assemblies list) and **Assemblies** (other full assemblies). The second section should be removed so the picker only offers sub assemblies.

## Changes

- In the assembly detail picker (`src/pages/Assemblies.tsx`), stop passing the other-assemblies list and its label/existing-ids into the sub assembly picker, so only the Sub Assemblies section renders.
- Keep the existing sub-assembly add logic (cost roll-up from the sub assembly's parts/inventory items) untouched.
- Leave already-added nested full assemblies on existing assemblies intact — they still display and can be removed; they just can no longer be newly added from this picker.
- The picker component itself keeps its optional full-assemblies support (used nowhere else after this change), so no other screen is affected.

## Notes

Nothing changes in the database or in the Sub Assemblies pages themselves.
