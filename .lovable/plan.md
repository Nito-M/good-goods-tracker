# Model Number Builder for Trailer Configurator

Add a new "Model Number" tab in the Trailer Config Admin page that defines an 8-slot template. Each slot maps to one configurator step (or a fixed text separator), and each option in those steps gets a short code. The system concatenates the codes — in slot order — using a configurable separator to produce a model number, displayed live in the customer Trailer Configurator and on Prebuilt Assembly detail/list pages.

## Data model (new tables + columns)

**New table: `model_number_template`** (singleton per user/org)
- `id uuid pk`, `user_id uuid`, `separator text default '-'`, `created_at`, `updated_at`

**New table: `model_number_slots`** — the 8 ordered positions
- `id uuid pk`, `template_id uuid fk`, `position int (1-8)`
- `slot_kind text` — one of:
  - `trailer_type`, `trailer_subtype`, `trailer_length`, `axle_count`
  - `front_end`, `front_end_tier2`
  - `back_end`, `deck_type`
  - `under_carriage`, `under_carriage_tier2`, `under_carriage_tier3`
  - `fixed` (literal text)
  - `empty` (skip)
- `fixed_text text` (used when slot_kind = 'fixed')
- `override_codes jsonb` — optional `{ "<item_id>": "X" }` per-slot overrides

**New columns: model code on each option source**
- `trailer_types.model_code text`
- `trailer_subtypes.model_code text`
- `trailer_lengths.model_code text`
- `assembly_components.model_code text` (covers all 4 categories + tiers)
- Axle count code lives in `model_number_slots.override_codes` keyed by the number (e.g. `{"2":"A","3":"B"}`).

Defaults: when a code is missing, fall back to first character of the name (uppercased) so model numbers always render.

## UI: new "Model Number" tab in `TrailerConfigAdmin.tsx`

Sits as the 6th tab next to Prebuilt Assemblies. Layout:

```text
[Separator: "-"]   [Live preview: A-2-B-X-3]

Slot 1  [ Front End ▾ ]                  [Edit codes]
Slot 2  [ Front End Tier 2 ▾ ]           [Edit codes]
Slot 3  [ Fixed text ▾ ] [ "X" input ]
Slot 4  [ Trailer Length ▾ ]             [Edit codes]
Slot 5  [ Back End ▾ ]                   [Edit codes]
Slot 6  [ Axle Count ▾ ]                 [Edit codes]
Slot 7  [ Deck Type ▾ ]                  [Edit codes]
Slot 8  [ Empty ▾ ]
```

- Each slot row: a `Select` for `slot_kind`, plus an "Edit codes" button that opens a dialog listing all items of that kind with an inline code `Input` (saves to that item's `model_code`, or to `override_codes` for axle counts).
- Item edit forms (Trailer Types, Subtypes, Lengths, Components on the existing tabs) also gain a small `Model Code` field — answering "Both" for code source.
- Live preview at top uses the currently-saved Prebuilt Assembly with the most recent `updated_at` so admins can see a real example, or shows placeholders if none.

## Live model number computation

Add a shared helper `src/lib/modelNumber.ts`:

```ts
export function buildModelNumber(
  template: { separator: string; slots: ModelNumberSlot[] },
  ctx: {
    trailerType?: TrailerType | null;
    subtype?: TrailerSubtype | null;
    length?: TrailerLength | null;
    axleCount?: number | null;
    frontEnd?: AssemblyComponent | null;
    frontEndTier2?: AssemblyComponent | null;
    backEnd?: AssemblyComponent | null;
    deckType?: AssemblyComponent | null;
    underCarriage?: AssemblyComponent | null;
    underCarriageTier2?: AssemblyComponent | null;
    underCarriageTier3?: AssemblyComponent | null;
  }
): string
```

Returns the joined string. Empty/missing slots are skipped (no consecutive separators).

Add `useModelNumberTemplate()` hook in `src/hooks/useTrailerConfig.ts` that loads the template + slots and exposes them.

## Display the number

- **`src/pages/TrailerConfigurator.tsx`** — sticky header / summary bar shows the current model number, recomputed on each step change. Already has all selection state in scope.
- **`src/pages/PrebuiltAssemblyDetail.tsx`** — show "Model #: …" in the page header, alongside the existing fields.
- **`src/pages/TrailerConfigAdmin.tsx`** Prebuilt Assemblies tab (list) — add a "Model #" column to the table.

## Migrations

Single migration creates the two new tables (with RLS scoped to `users_share_org`), adds the `model_code` columns, and seeds one empty template per existing user with 8 `empty` slots so the page works on first load.

## Out of scope

- No changes to how prebuilt assemblies match configurations (lookup logic untouched).
- No PDF / quote integration of the model number in this pass — display only.
- Storefront does not show the model number (admin/configurator only).
