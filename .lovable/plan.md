## Problem
When a specific sub-type (model) is selected in the Assemblies page, the sidebar list still seeds groups for **all** known models. This causes empty sub-type headers to linger with "No assemblies in this sub-type yet."

## Fix
Update the `groupedFiltered` `useMemo` in `src/pages/Assemblies.tsx` so that when `selectedSubType` is a specific model name, only that model's group is created. Keep the current all-models behavior when viewing `__all__` or `__unassigned__`.

### Technical Detail
In the `groupedFiltered` calculation (lines ~1135-1150):
- If `selectedSubType` is a concrete model string (not `null`, `'__all__'`, or `'__unassigned__'`): only seed `groups.set(selectedSubType, [])`.
- Otherwise: keep seeding all `assemblyModels` as before.

This is a single-file, single-block edit with zero risk to other functionality.