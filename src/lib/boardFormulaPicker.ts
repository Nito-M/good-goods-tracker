/**
 * Tiny pub/sub for spreadsheet-style formula cell picking.
 *
 * While a TextCell is editing a formula (value starting with "="), it
 * registers an "inserter" callback. When any other grid cell is clicked,
 * BoardDetail asks `pickCellRef(ref)` — if there is an active editor, the
 * ref (e.g. "B3") is inserted at the input's cursor and the click is
 * absorbed (focus stays on the formula input).
 */

type Inserter = (ref: string) => void;

let active: Inserter | null = null;

export function setActiveFormulaEditor(fn: Inserter): () => void {
  active = fn;
  return () => {
    if (active === fn) active = null;
  };
}

export function isFormulaPickActive(): boolean {
  return active !== null;
}

export function pickCellRef(ref: string): boolean {
  if (!active) return false;
  active(ref);
  return true;
}
