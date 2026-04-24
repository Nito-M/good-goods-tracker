// Palette for per-cell background colors. Stored as a token string like
// "red-200" or "slate-700" in board_cells.bg_color (null = no color).
//
// We keep it as static HEX values (not Tailwind classes) so the same color
// also works inside the PDF exporter. Each color has 5 shades from light to
// dark — pick whatever matches the user's contrast needs.

export type CellColorName =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'slate';

export type CellColorShade = 100 | 300 | 500 | 700 | 900;

// HEX values pulled from Tailwind's default palette so they read consistently
// across the app and in exported PDFs.
const PALETTE: Record<CellColorName, Record<CellColorShade, string>> = {
  red:    { 100: '#fee2e2', 300: '#fca5a5', 500: '#ef4444', 700: '#b91c1c', 900: '#7f1d1d' },
  orange: { 100: '#ffedd5', 300: '#fdba74', 500: '#f97316', 700: '#c2410c', 900: '#7c2d12' },
  amber:  { 100: '#fef3c7', 300: '#fcd34d', 500: '#f59e0b', 700: '#b45309', 900: '#78350f' },
  yellow: { 100: '#fef9c3', 300: '#fde047', 500: '#eab308', 700: '#a16207', 900: '#713f12' },
  lime:   { 100: '#ecfccb', 300: '#bef264', 500: '#84cc16', 700: '#4d7c0f', 900: '#365314' },
  green:  { 100: '#dcfce7', 300: '#86efac', 500: '#22c55e', 700: '#15803d', 900: '#14532d' },
  teal:   { 100: '#ccfbf1', 300: '#5eead4', 500: '#14b8a6', 700: '#0f766e', 900: '#134e4a' },
  cyan:   { 100: '#cffafe', 300: '#67e8f9', 500: '#06b6d4', 700: '#0e7490', 900: '#164e63' },
  blue:   { 100: '#dbeafe', 300: '#93c5fd', 500: '#3b82f6', 700: '#1d4ed8', 900: '#1e3a8a' },
  indigo: { 100: '#e0e7ff', 300: '#a5b4fc', 500: '#6366f1', 700: '#4338ca', 900: '#312e81' },
  violet: { 100: '#ede9fe', 300: '#c4b5fd', 500: '#8b5cf6', 700: '#6d28d9', 900: '#4c1d95' },
  purple: { 100: '#f3e8ff', 300: '#d8b4fe', 500: '#a855f7', 700: '#7e22ce', 900: '#581c87' },
  pink:   { 100: '#fce7f3', 300: '#f9a8d4', 500: '#ec4899', 700: '#be185d', 900: '#831843' },
  rose:   { 100: '#ffe4e6', 300: '#fda4af', 500: '#f43f5e', 700: '#be123c', 900: '#881337' },
  slate:  { 100: '#f1f5f9', 300: '#cbd5e1', 500: '#64748b', 700: '#334155', 900: '#0f172a' },
};

export const CELL_COLOR_NAMES: CellColorName[] = Object.keys(PALETTE) as CellColorName[];
export const CELL_COLOR_SHADES: CellColorShade[] = [100, 300, 500, 700, 900];

export function cellColorToken(name: CellColorName, shade: CellColorShade): string {
  return `${name}-${shade}`;
}

/** Parse a stored token like "red-200" into name/shade. Returns null if invalid. */
export function parseCellColorToken(
  token: string | null | undefined
): { name: CellColorName; shade: CellColorShade } | null {
  if (!token) return null;
  const idx = token.lastIndexOf('-');
  if (idx === -1) return null;
  const name = token.slice(0, idx) as CellColorName;
  const shade = Number(token.slice(idx + 1)) as CellColorShade;
  if (!(name in PALETTE)) return null;
  if (!PALETTE[name][shade]) return null;
  return { name, shade };
}

/** Resolve a token to a HEX value usable in CSS or PDF. Returns null if unknown. */
export function cellColorToHex(token: string | null | undefined): string | null {
  const parsed = parseCellColorToken(token);
  if (!parsed) return null;
  return PALETTE[parsed.name][parsed.shade];
}

/** Resolve a token to an [r, g, b] tuple for jsPDF fillColor. */
export function cellColorToRgb(token: string | null | undefined): [number, number, number] | null {
  const hex = cellColorToHex(token);
  if (!hex) return null;
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Return a readable foreground color (#000 or #fff) for the given background
 * token, using a perceived-luminance threshold. This lets us auto-flip text to
 * white on dark cells without the user having to configure it.
 */
export function readableTextColor(token: string | null | undefined): string | null {
  const rgb = cellColorToRgb(token);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  // sRGB relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#000000' : '#ffffff';
}
