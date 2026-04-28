import type {
  TrailerType,
  TrailerSubtype,
  TrailerLength,
  AssemblyComponent,
} from '@/hooks/useTrailerConfig';

export type SlotKind =
  | 'empty'
  | 'fixed'
  | 'conditional'
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

// A field that a conditional rule can test
export type ConditionField =
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

export interface ConditionClause {
  field: ConditionField;
  // For id-based fields, value is the id; for axle_count, value is the number as string.
  value: string;
}

export interface ConditionalRule {
  id: string;
  // 1-2 clauses; all must match (AND).
  conditions: ConditionClause[];
  code: string;
}

export interface ModelNumberSlot {
  id: string;
  template_id: string;
  user_id: string;
  position: number;
  slot_kind: SlotKind;
  fixed_text: string | null;
  override_codes: Record<string, string>;
  separator_after?: boolean;
  conditional_rules?: ConditionalRule[];
  secondary_slot_kind?: SlotKind | null;
  secondary_fixed_text?: string | null;
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

function getCtxFieldId(ctx: BuildContext, field: ConditionField): string | null {
  switch (field) {
    case 'trailer_type': return ctx.trailerType?.id ?? null;
    case 'trailer_subtype': return ctx.subtype?.id ?? null;
    case 'trailer_length': return ctx.length?.id ?? null;
    case 'axle_count': return ctx.axleCount != null ? String(ctx.axleCount) : null;
    case 'front_end': return ctx.frontEnd?.id ?? null;
    case 'front_end_tier2': return ctx.frontEndTier2?.id ?? null;
    case 'back_end': return ctx.backEnd?.id ?? null;
    case 'deck_type': return ctx.deckType?.id ?? null;
    case 'under_carriage': return ctx.underCarriage?.id ?? null;
    case 'under_carriage_tier2': return ctx.underCarriageTier2?.id ?? null;
    case 'under_carriage_tier3': return ctx.underCarriageTier3?.id ?? null;
  }
}

function evaluateConditionalRules(slot: ModelNumberSlot, ctx: BuildContext): string | null {
  const rules = slot.conditional_rules;
  if (!rules || rules.length === 0) return null;
  for (const rule of rules) {
    if (!rule.conditions || rule.conditions.length === 0) continue;
    const allMatch = rule.conditions.every(c => getCtxFieldId(ctx, c.field) === c.value);
    if (allMatch) return rule.code ?? '';
  }
  return null;
}

export function resolveSlot(slot: ModelNumberSlot, ctx: BuildContext): string {
  // Conditional rules win over default codes for any slot kind.
  const ruleHit = evaluateConditionalRules(slot, ctx);
  if (ruleHit !== null) return ruleHit;

  switch (slot.slot_kind) {
    case 'empty':
      return '';
    case 'conditional':
      // Pure conditional: only the rules produce output. No match → empty.
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
  const resolved = ordered.map(s => ({ slot: s, code: resolveSlot(s, ctx) }));

  // If no slot has separator_after configured, fall back to joining with separator between every part.
  const anyExplicit = resolved.some(r => r.slot.separator_after);
  if (!anyExplicit) {
    return resolved.map(r => r.code).filter(p => p && p.length > 0).join(sep);
  }

  let out = '';
  for (let i = 0; i < resolved.length; i++) {
    const { slot, code } = resolved[i];
    if (!code) continue;
    out += code;
    if (slot.separator_after && i < resolved.length - 1) {
      // only append separator if there is more non-empty content after
      const hasMore = resolved.slice(i + 1).some(r => r.code && r.code.length > 0);
      if (hasMore) out += sep;
    }
  }
  return out;
}

export const SLOT_KIND_LABELS: Record<SlotKind, string> = {
  empty: 'Empty',
  fixed: 'Fixed text',
  conditional: 'Conditional (rules only)',
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
  'conditional',
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

export const CONDITION_FIELDS: ConditionField[] = [
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

export const CONDITION_FIELD_LABELS: Record<ConditionField, string> = {
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
