import type {
  TrailerType,
  TrailerSubtype,
  TrailerLength,
  AssemblyComponent,
} from '@/hooks/useTrailerConfig';

export type SlotKind =
  | 'empty'
  | 'fixed'
  | 'trailer_type'
  | 'trailer_subtype'
  | 'trailer_length'
  | 'axle_count'
  | 'front_end'
  | 'front_end_tier2'
  | 'back_end'
  | 'deck_type'
  | 'under_carriage'
  | 'under_carriage_tier2'
  | 'under_carriage_tier3';

export interface ModelNumberSlot {
  id: string;
  template_id: string;
  user_id: string;
  position: number;
  slot_kind: SlotKind;
  fixed_text: string | null;
  override_codes: Record<string, string>;
}

export interface ModelNumberTemplate {
  id: string;
  user_id: string;
  separator: string;
}

export interface BuildContext {
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

const fallbackCode = (name?: string | null) =>
  (name || '').trim().charAt(0).toUpperCase();

const codeFor = (
  slot: ModelNumberSlot,
  id: string | null | undefined,
  modelCode: string | null | undefined,
  name: string | null | undefined,
): string => {
  if (id && slot.override_codes && slot.override_codes[id]) return slot.override_codes[id];
  if (modelCode && modelCode.trim()) return modelCode.trim();
  return fallbackCode(name);
};

export function resolveSlot(slot: ModelNumberSlot, ctx: BuildContext): string {
  switch (slot.slot_kind) {
    case 'empty':
      return '';
    case 'fixed':
      return (slot.fixed_text || '').trim();
    case 'trailer_type':
      return ctx.trailerType
        ? codeFor(slot, ctx.trailerType.id, (ctx.trailerType as any).model_code, ctx.trailerType.name)
        : '';
    case 'trailer_subtype':
      return ctx.subtype
        ? codeFor(slot, ctx.subtype.id, (ctx.subtype as any).model_code, ctx.subtype.name)
        : '';
    case 'trailer_length':
      return ctx.length
        ? codeFor(slot, ctx.length.id, (ctx.length as any).model_code, ctx.length.label)
        : '';
    case 'axle_count': {
      if (ctx.axleCount == null) return '';
      const key = String(ctx.axleCount);
      if (slot.override_codes && slot.override_codes[key]) return slot.override_codes[key];
      return key;
    }
    case 'front_end':
      return ctx.frontEnd ? codeFor(slot, ctx.frontEnd.id, (ctx.frontEnd as any).model_code, ctx.frontEnd.name) : '';
    case 'front_end_tier2':
      return ctx.frontEndTier2 ? codeFor(slot, ctx.frontEndTier2.id, (ctx.frontEndTier2 as any).model_code, ctx.frontEndTier2.name) : '';
    case 'back_end':
      return ctx.backEnd ? codeFor(slot, ctx.backEnd.id, (ctx.backEnd as any).model_code, ctx.backEnd.name) : '';
    case 'deck_type':
      return ctx.deckType ? codeFor(slot, ctx.deckType.id, (ctx.deckType as any).model_code, ctx.deckType.name) : '';
    case 'under_carriage':
      return ctx.underCarriage ? codeFor(slot, ctx.underCarriage.id, (ctx.underCarriage as any).model_code, ctx.underCarriage.name) : '';
    case 'under_carriage_tier2':
      return ctx.underCarriageTier2 ? codeFor(slot, ctx.underCarriageTier2.id, (ctx.underCarriageTier2 as any).model_code, ctx.underCarriageTier2.name) : '';
    case 'under_carriage_tier3':
      return ctx.underCarriageTier3 ? codeFor(slot, ctx.underCarriageTier3.id, (ctx.underCarriageTier3 as any).model_code, ctx.underCarriageTier3.name) : '';
    default:
      return '';
  }
}

export function buildModelNumber(
  template: { separator: string; slots: ModelNumberSlot[] } | null | undefined,
  ctx: BuildContext,
): string {
  if (!template) return '';
  const sep = template.separator ?? '-';
  const ordered = [...template.slots].sort((a, b) => a.position - b.position);
  const parts = ordered
    .map(s => resolveSlot(s, ctx))
    .filter(p => p && p.length > 0);
  return parts.join(sep);
}

export const SLOT_KIND_LABELS: Record<SlotKind, string> = {
  empty: 'Empty',
  fixed: 'Fixed text',
  trailer_type: 'Trailer Type',
  trailer_subtype: 'Trailer Subtype',
  trailer_length: 'Trailer Length',
  axle_count: 'Axle Count',
  front_end: 'Front End',
  front_end_tier2: 'Front End — Tier 2',
  back_end: 'Back End',
  deck_type: 'Add Ons / Deck Type',
  under_carriage: 'Under Carriage',
  under_carriage_tier2: 'Under Carriage — Tier 2',
  under_carriage_tier3: 'Under Carriage — Tier 3',
};

export const ALL_SLOT_KINDS: SlotKind[] = [
  'empty',
  'fixed',
  'trailer_type',
  'trailer_subtype',
  'trailer_length',
  'axle_count',
  'front_end',
  'front_end_tier2',
  'back_end',
  'deck_type',
  'under_carriage',
  'under_carriage_tier2',
  'under_carriage_tier3',
];
