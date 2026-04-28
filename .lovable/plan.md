# Match component restrictions on Prebuilt detail page to the Trailer Configurator

Right now, the Prebuilt Assembly detail page lets you pick from **all** components and **all** lengths regardless of the trailer type. The customer-facing Trailer Configurator already filters them by `compatible_trailer_type_ids` (per component) and `allowed_axle_counts` (per length). We'll mirror those exact rules here so admins see the same valid options.

## Changes

**`src/pages/PrebuiltAssemblyDetail.tsx`**

- Use `getByCategory(category, trailerTypeId, parentId)` from `useAssemblyComponents` instead of the local "all components" filter. This applies the existing `compatible_trailer_type_ids` rule per component.
  - `frontEndStep1` → `getByCategory('front_end', trailerTypeId, null)`
  - `frontEndStep2` → `getByCategory('front_end', trailerTypeId, frontEndId)` (when set)
  - `backEnds` → `getByCategory('back_end', trailerTypeId)`
  - `deckTypes` → `getByCategory('deck_type', trailerTypeId)`
  - `ucStep1` → `getByCategory('under_carriage', trailerTypeId, null)`
  - `ucStep2` → `getByCategory('under_carriage', trailerTypeId, underCarriageId)`
  - `ucStep3` → `getByCategory('under_carriage', trailerTypeId, underCarriageTier2Id)`
- **Lengths**: keep the existing trailer-type compatibility filter (already in place).
- **Axles**: replace the hard-coded "2 / 3 Axles" list with the selected length's `allowed_axle_counts` (fall back to `[2, 3]` when the length has no restriction or none selected) — same logic as the configurator.
- **Auto-clear stale selections** when the trailer type's restrictions would invalidate them (defensive: if the currently saved component is no longer in the filtered list, leave it visible but flagged so admins notice — show the current value as a disabled "Currently set" item appended to the dropdown). This prevents data loss for older prebuilt rows configured before restrictions were tightened.

## Out of scope

- No schema changes — restrictions already exist on `assembly_components.compatible_trailer_type_ids` and `trailer_lengths.allowed_axle_counts`.
- The admin "Add Prebuilt" form on `TrailerConfigAdmin.tsx` already mostly matches the configurator; not touching it in this pass unless you want me to align it too.
