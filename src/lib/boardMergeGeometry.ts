import type { BoardMerge } from '@/hooks/useBoardMerges';

export interface MergeRect {
  id: string;
  startRowIdx: number;
  endRowIdx: number;
  startColIdx: number;
  endColIdx: number;
  anchorRowId: string;
  anchorColId: string;
}

/**
 * Compute geometry for each merge given the current row & column orderings.
 * Display-only: orderings come from whatever the table is currently rendering
 * (e.g. the global row list and `visibleColumns`).
 *
 * Merges that reference rows/columns no longer present (deleted, hidden) are
 * skipped — they remain in the database but produce no visual effect.
 */
export function computeMergeRects(
  merges: BoardMerge[],
  rowIds: string[],
  colIds: string[]
): MergeRect[] {
  const rowIdx = new Map(rowIds.map((id, i) => [id, i]));
  const colIdx = new Map(colIds.map((id, i) => [id, i]));
  const rects: MergeRect[] = [];
  for (const m of merges) {
    const r1 = rowIdx.get(m.start_row_id);
    const r2 = rowIdx.get(m.end_row_id);
    const c1 = colIdx.get(m.start_column_id);
    const c2 = colIdx.get(m.end_column_id);
    if (r1 === undefined || r2 === undefined || c1 === undefined || c2 === undefined) continue;
    const startRowIdx = Math.min(r1, r2);
    const endRowIdx = Math.max(r1, r2);
    const startColIdx = Math.min(c1, c2);
    const endColIdx = Math.max(c1, c2);
    rects.push({
      id: m.id,
      startRowIdx,
      endRowIdx,
      startColIdx,
      endColIdx,
      anchorRowId: rowIds[startRowIdx],
      anchorColId: colIds[startColIdx],
    });
  }
  return rects;
}

export interface CellGeometry {
  /** If set, this cell is the anchor — render with rowSpan/colSpan */
  span?: { rowSpan: number; colSpan: number; mergeId: string };
  /** If true, this cell is covered by a merge — do not render the <td>. */
  hidden?: boolean;
}

export function buildCellGeometryMap(rects: MergeRect[], rowIds: string[], colIds: string[]) {
  // key = `${rowId}::${colId}`
  const map = new Map<string, CellGeometry>();
  for (const rect of rects) {
    const anchorKey = `${rowIds[rect.startRowIdx]}::${colIds[rect.startColIdx]}`;
    map.set(anchorKey, {
      span: {
        rowSpan: rect.endRowIdx - rect.startRowIdx + 1,
        colSpan: rect.endColIdx - rect.startColIdx + 1,
        mergeId: rect.id,
      },
    });
    for (let r = rect.startRowIdx; r <= rect.endRowIdx; r++) {
      for (let c = rect.startColIdx; c <= rect.endColIdx; c++) {
        const key = `${rowIds[r]}::${colIds[c]}`;
        if (key === anchorKey) continue;
        map.set(key, { hidden: true });
      }
    }
  }
  return map;
}

/** Find the merge (if any) that contains the given cell. */
export function findContainingMerge(
  rects: MergeRect[],
  rowIdx: number,
  colIdx: number
): MergeRect | null {
  for (const r of rects) {
    if (rowIdx >= r.startRowIdx && rowIdx <= r.endRowIdx && colIdx >= r.startColIdx && colIdx <= r.endColIdx) {
      return r;
    }
  }
  return null;
}
