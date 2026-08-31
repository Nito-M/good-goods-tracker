/**
 * Shared per-unit note composition so the sales order / quote PDF and invoices
 * created from selected items render identical note blocks.
 */

/** Note lines for an item: per-unit notes when present, else the plain item note */
export function buildUnitNoteLines(
  units: (string | null)[],
  itemNotes: string | null,
): string[] {
  const filled = units
    .map((n, i) => ({ note: (n ?? '').trim(), index: i }))
    .filter((u) => u.note);
  if (filled.length === 0) return itemNotes ? [`Note: ${itemNotes}`] : [];
  const unique = new Set(filled.map((u) => u.note));
  if (unique.size === 1 && filled.length === units.length) return [`Note: ${filled[0].note}`];
  return filled.map((u) => `Unit ${u.index + 1}: ${u.note}`);
}

/**
 * Same rules, but returned as a single string suitable for storing in
 * `sale_items.notes` (the leading "Note: " prefix is dropped there because the
 * invoice PDF adds its own prefix).
 */
export function composeUnitNotes(
  units: (string | null)[],
  itemNotes: string | null,
): string | null {
  const lines = buildUnitNoteLines(units, itemNotes);
  if (lines.length === 0) return null;
  if (lines.length === 1) return lines[0].replace(/^Note:\s*/, '');
  return lines.join('\n');
}

/**
 * Note text for a single unit: its own per-unit note when present, otherwise
 * the item's shared note (same fallback the sales order PDF uses).
 */
export function resolveUnitNote(
  unitNote: string | null | undefined,
  itemNotes: string | null | undefined,
): string | null {
  const own = (unitNote ?? '').trim();
  if (own) return own;
  const shared = (itemNotes ?? '').trim();
  return shared || null;
}

