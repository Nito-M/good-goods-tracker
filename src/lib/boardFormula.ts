/**
 * Lightweight spreadsheet-style formula evaluator for board text cells.
 *
 * Supported:
 *   - Cell refs in the form A1, B2, AA10 (column letters + row number).
 *     Letters refer to the column's position in the visible grid (A = 1st column).
 *     Numbers refer to the row's position (1 = first row).
 *   - Operators + - * / and parentheses
 *   - Numeric literals (e.g. 1.5, 0.25)
 *   - Built-in functions: SUM, AVG/AVERAGE, MIN, MAX, COUNT
 *     -> support ranges like SUM(A1:A5) or comma-separated args SUM(A1, B2, 3)
 *
 * A value starting with "=" is treated as a formula.
 */

export type CellAddress = { col: number; row: number }; // 0-indexed

export interface FormulaContext {
  /** Resolve a cell address to its raw stored string value. */
  getValueAt: (col: number, row: number) => string;
  /** Total number of columns and rows in the addressable grid. */
  colCount: number;
  rowCount: number;
}

export function isFormula(v: string | null | undefined): boolean {
  return typeof v === 'string' && v.trim().startsWith('=');
}

/** A → 0, B → 1, AA → 26, etc. Returns -1 if invalid. */
export function columnLettersToIndex(letters: string): number {
  const up = letters.toUpperCase();
  if (!/^[A-Z]+$/.test(up)) return -1;
  let n = 0;
  for (let i = 0; i < up.length; i++) {
    n = n * 26 + (up.charCodeAt(i) - 64);
  }
  return n - 1;
}

/** 0 → A, 1 → B, 26 → AA, etc. */
export function indexToColumnLetters(index: number): string {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s || 'A';
}

function parseRef(ref: string): CellAddress | null {
  const m = /^([A-Za-z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  const col = columnLettersToIndex(m[1]);
  const row = parseInt(m[2], 10) - 1;
  if (col < 0 || row < 0) return null;
  return { col, row };
}

function toNumber(raw: string): number {
  if (raw == null) return 0;
  const trimmed = String(raw).trim();
  if (trimmed === '') return 0;
  // Strip common formatting (commas, $)
  const cleaned = trimmed.replace(/[$,]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function expandRange(a: CellAddress, b: CellAddress, ctx: FormulaContext): number[] {
  const c1 = Math.min(a.col, b.col);
  const c2 = Math.max(a.col, b.col);
  const r1 = Math.min(a.row, b.row);
  const r2 = Math.max(a.row, b.row);
  const out: number[] = [];
  for (let c = c1; c <= c2; c++) {
    for (let r = r1; r <= r2; r++) {
      if (c < 0 || r < 0 || c >= ctx.colCount || r >= ctx.rowCount) continue;
      const raw = ctx.getValueAt(c, r);
      out.push(toNumber(raw));
    }
  }
  return out;
}

/**
 * Recursion-safe formula evaluation. Returns either a number or an error
 * string starting with "#" (e.g. "#REF", "#ERR", "#DIV/0", "#CYCLE").
 */
export function evaluateFormula(
  expression: string,
  ctx: FormulaContext,
  visiting: Set<string> = new Set()
): number | string {
  let expr = expression.trim();
  if (expr.startsWith('=')) expr = expr.slice(1);
  if (!expr) return '';

  try {
    // Replace function calls (SUM/AVG/MIN/MAX/COUNT/AVERAGE)
    expr = expandFunctions(expr, ctx, visiting);

    // Replace cell refs with their numeric values, recursing through formulas.
    expr = expr.replace(/([A-Za-z]+)(\d+)/g, (_m, letters: string, digits: string) => {
      const ref = `${letters.toUpperCase()}${digits}`;
      const addr = parseRef(ref);
      if (!addr) return '0';
      if (addr.col >= ctx.colCount || addr.row >= ctx.rowCount) return '0';
      const raw = ctx.getValueAt(addr.col, addr.row);
      const resolved = resolveValue(ref, raw, ctx, visiting);
      if (typeof resolved === 'string' && resolved.startsWith('#')) {
        throw new Error(resolved);
      }
      return `(${resolved})`;
    });

    // Final expression must be safe arithmetic only.
    if (!/^[\d+\-*/().,\s]*$/.test(expr)) return '#ERR';
    if (expr.trim() === '') return '';

    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr});`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      if (result === Infinity || result === -Infinity) return '#DIV/0';
      return '#ERR';
    }
    // Round trailing float garbage
    return Math.round(result * 1e10) / 1e10;
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.startsWith('#')) return msg;
    return '#ERR';
  }
}

function resolveValue(
  ref: string,
  raw: string,
  ctx: FormulaContext,
  visiting: Set<string>
): number | string {
  if (isFormula(raw)) {
    if (visiting.has(ref)) return '#CYCLE';
    const next = new Set(visiting);
    next.add(ref);
    const v = evaluateFormula(raw, ctx, next);
    if (typeof v === 'string') return v;
    return v;
  }
  return toNumber(raw);
}

function expandFunctions(expr: string, ctx: FormulaContext, visiting: Set<string>): string {
  const fnRegex = /\b(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\s*\(([^()]*)\)/i;
  // Replace innermost function calls iteratively.
  let safety = 0;
  while (fnRegex.test(expr)) {
    if (++safety > 50) break;
    expr = expr.replace(fnRegex, (_m, name: string, body: string) => {
      const values = collectArgValues(body, ctx, visiting);
      const fn = name.toUpperCase();
      let result = 0;
      switch (fn) {
        case 'SUM':
          result = values.reduce((a, b) => a + b, 0);
          break;
        case 'AVG':
        case 'AVERAGE':
          result = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          break;
        case 'MIN':
          result = values.length ? Math.min(...values) : 0;
          break;
        case 'MAX':
          result = values.length ? Math.max(...values) : 0;
          break;
        case 'COUNT':
          result = values.length;
          break;
      }
      return `(${result})`;
    });
  }
  return expr;
}

function collectArgValues(body: string, ctx: FormulaContext, visiting: Set<string>): number[] {
  const parts = body.split(',').map((p) => p.trim()).filter(Boolean);
  const out: number[] = [];
  for (const part of parts) {
    const rangeMatch = /^([A-Za-z]+\d+)\s*:\s*([A-Za-z]+\d+)$/.exec(part);
    if (rangeMatch) {
      const a = parseRef(rangeMatch[1]);
      const b = parseRef(rangeMatch[2]);
      if (a && b) out.push(...expandRange(a, b, ctx));
      continue;
    }
    const refMatch = /^[A-Za-z]+\d+$/.exec(part);
    if (refMatch) {
      const addr = parseRef(part);
      if (addr && addr.col < ctx.colCount && addr.row < ctx.rowCount) {
        const raw = ctx.getValueAt(addr.col, addr.row);
        const resolved = resolveValue(part.toUpperCase(), raw, ctx, visiting);
        if (typeof resolved === 'number') out.push(resolved);
      }
      continue;
    }
    // Plain number
    const n = parseFloat(part);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/** Format a numeric result for display, trimming insignificant zeros. */
export function formatFormulaResult(v: number | string): string {
  if (typeof v === 'string') return v;
  if (!Number.isFinite(v)) return '#ERR';
  // Up to 6 significant decimal places, trimmed
  const fixed = v.toFixed(6);
  return fixed.replace(/\.?0+$/, '');
}
