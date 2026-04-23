import type { StatusOption } from '@/components/board/StatusOptionsDialog';

export interface ResolvedStatus {
  selectedId: string;
  rowOptions: StatusOption[];
}

/**
 * Status cell values can be in two formats:
 *  - plain string id (legacy / shared-options column)
 *  - JSON object `{ selectedId, rowOptions }` (per-row-options column)
 */
export function parseStatusValue(value: string, perRowOptions: boolean): ResolvedStatus {
  if (!perRowOptions) return { selectedId: value || '', rowOptions: [] };
  if (!value) return { selectedId: '', rowOptions: [] };
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rowOptions)) {
      return {
        selectedId: typeof parsed.selectedId === 'string' ? parsed.selectedId : '',
        rowOptions: parsed.rowOptions as StatusOption[],
      };
    }
  } catch {
    // legacy plain string stored before per-row-options was enabled
  }
  return { selectedId: value, rowOptions: [] };
}

/** Resolves the selected option for a status cell, using per-row options when applicable. */
export function resolveSelectedStatus(
  value: string,
  columnOptions: StatusOption[],
  perRowOptions: boolean
): { selectedId: string; option: StatusOption | undefined } {
  const { selectedId, rowOptions } = parseStatusValue(value, perRowOptions);
  const pool = perRowOptions ? rowOptions : columnOptions;
  return { selectedId, option: pool.find((o) => o.id === selectedId) };
}
