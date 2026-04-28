
# Secondary Slot Kind (Override) for Model Number Slots

Let each of the 8 model number positions optionally define a **secondary slot kind**. In the customer Trailer Configurator, if the user has a selection for the secondary kind, its code is emitted at that position instead of the primary's code. If the secondary has no selection, the primary's code is used as today.

## Example

- Slot #4: Primary = **Trailer Length**, Secondary = **Trailer Subtype**
- Customer picks Length = "20 ft" only → slot #4 emits Length code (e.g. `20`)
- Customer also picks Subtype = "Tilt Deck" → slot #4 emits Subtype code (e.g. `T`), overriding the length

## Database

Add two nullable columns to `public.model_number_slots`:

- `secondary_slot_kind text` — same enum as `slot_kind`, nullable. `null` / `'empty'` = no secondary.
- `secondary_fixed_text text` — used only if `secondary_slot_kind = 'fixed'`.

The existing `override_codes jsonb` and `conditional_rules jsonb` stay shared for the slot (per the user's choice: "Share the slot's rules, separate codes"). Per-item default `model_code` already lives on the source items themselves, so secondary picks up its own item's default code automatically. Slot-level `override_codes` apply to whichever item id ends up resolved (primary or secondary), since item ids are globally unique across each kind.

## Logic — `src/lib/modelNumber.ts`

Update `ModelNumberSlot` interface to include the two new fields.

In `resolveSlot(slot, ctx)`:

1. Evaluate `conditional_rules` first (unchanged) — rules still win over everything.
2. If `secondary_slot_kind` is set and not `'empty'`, build a temporary "secondary slot" object that reuses the same `override_codes` and `conditional_rules` but with `slot_kind = secondary_slot_kind` and `fixed_text = secondary_fixed_text`. Resolve it (without re-running rules — pass a flag, or inline the switch). If it produces a non-empty code, **return that code**.
3. Otherwise fall through to the primary `slot_kind` switch (unchanged).

Refactor the body of the current switch into a helper `resolveByKind(kind, fixedText, slot, ctx)` so primary and secondary both call it. Rules evaluation stays in the outer `resolveSlot`.

## Hook — `src/hooks/useModelNumberTemplate.ts`

- Add `secondary_slot_kind` and `secondary_fixed_text` to the `Pick<>` allowed in `updateSlot`.
- Pass them through in the local `setSlots` patch.

## Admin UI — `src/components/ModelNumberTab.tsx`

For each slot row, add a small **"+ Add secondary"** button next to the primary `Select` (only shown when no secondary is configured and primary kind is not `empty`). When clicked, it sets `secondary_slot_kind = 'trailer_type'` (placeholder default) so the controls appear.

When a secondary exists, render a second compact row beneath the primary, indented and labeled "Overrides with":

```text
#4 [ Trailer Length ▾ ] [ Default code per option ] [☐ Sep after] [Codes][Rules]
   ↳ Overrides with: [ Trailer Subtype ▾ ] [ (fixed input if 'fixed') ] [✕ Remove secondary]
```

- Secondary `Select` reuses `ALL_SLOT_KINDS`.
- If secondary kind is `'fixed'`, show a small fixed-text Input with onBlur save (mirrors primary fixed-text behavior).
- Remove button sets `secondary_slot_kind: null` and `secondary_fixed_text: null`.
- The existing **Codes** dialog stays tied to the primary kind (since codes/overrides for the secondary's items live on those items' own `model_code` and the shared `override_codes` map). Add a one-line hint inside the dialog when a secondary is set: *"This slot also resolves '[Secondary Kind]' — manage its codes via that section's tab."*

The "Rules" dialog continues to govern the slot regardless (rules still win over both primary and secondary), per the answered preference.

## Live preview & configurator

No changes needed to call sites — `TrailerConfigurator.tsx` and `PrebuiltAssemblyDetail.tsx` already pass the full `BuildContext`, and the resolver does the rest. The admin Live Preview block updates automatically.

## Migration

Single migration:

```sql
ALTER TABLE public.model_number_slots
  ADD COLUMN secondary_slot_kind text,
  ADD COLUMN secondary_fixed_text text;
```

No backfill (NULL = no secondary, identical to today's behavior). RLS unaffected.

## Types

Regenerate `src/integrations/supabase/types.ts` will pick up new columns automatically; no manual edit required.

## Out of scope

- No per-secondary `override_codes` / `conditional_rules` (shared with primary by design).
- No third-tier slot.
- No changes to PDF/Quote rendering of the model number.
