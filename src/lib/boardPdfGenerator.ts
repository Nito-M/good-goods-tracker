import jsPDF from 'jspdf';
import autoTable, { type RowInput, type CellHookData, type CellDef } from 'jspdf-autotable';
import type { BoardColumn, BoardRow } from '@/hooks/useBoard';
import type { BoardCellFile } from '@/hooks/useBoardCellFiles';
import type { BoardMerge } from '@/hooks/useBoardMerges';
import { savePdfBlob } from '@/lib/pdfSave';
import { resolveSelectedStatus } from '@/lib/boardStatusValue';
import { computeMergeRects, buildCellGeometryMap } from '@/lib/boardMergeGeometry';
import { isFormula, evaluateFormula, formatFormulaResult, type FormulaContext } from '@/lib/boardFormula';
import { cellColorToRgb, readableTextColor } from '@/lib/boardCellColors';
import { formatCurrencyPdf } from '@/lib/utils';

interface GroupBlock {
  label: string | null;
  rows: BoardRow[];
}

interface GenerateOpts {
  boardName: string;
  columns: BoardColumn[];
  groups: GroupBlock[];
  getCellValue: (rowId: string, columnId: string) => string;
  getCellTextAlign?: (rowId: string, columnId: string) => 'left' | 'center' | 'right' | null;
  getCellBgColor?: (rowId: string, columnId: string) => string | null;
  getFiles: (rowId: string, columnId: string) => BoardCellFile[];
  merges?: BoardMerge[];
  logoUrl?: string | null;
  /** Optional: resolve a fresh signed URL for a given file id (more reliable than the stored URL). */
  refreshFileUrl?: (fileId: string) => Promise<string | null>;
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i;
function isImageFileName(name: string): boolean {
  return IMAGE_EXT_RE.test(name);
}

type LoadedImage = {
  dataUrl: string;
  width: number;
  height: number;
  format: 'PNG' | 'JPEG';
};

function rasterize(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  preserveAlpha: boolean
): LoadedImage | null {
  const MAX = 1400;
  const scale = Math.min(1, MAX / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  if (!preserveAlpha) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(source, 0, 0, w, h);
  if (preserveAlpha) {
    return { dataUrl: canvas.toDataURL('image/png'), width: w, height: h, format: 'PNG' };
  }
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), width: w, height: h, format: 'JPEG' };
}

function loadViaImageElement(url: string, useCors: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (useCors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Fetch image, downscale if huge, return base64 dataURL + dimensions for jsPDF. */
async function loadImageForPdf(url: string, preserveAlpha = false): Promise<LoadedImage | null> {
  // Preferred: fetch -> blob -> object URL -> <img>. The browser decodes
  // webp/heic/avif natively, and the object URL is same-origin so canvas
  // drawing never taints — much more reliable than createImageBitmap directly.
  try {
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        const img = await loadViaImageElement(objectUrl, false);
        if (img) {
          const out = rasterize(img, img.naturalWidth || img.width, img.naturalHeight || img.height, preserveAlpha);
          if (out) return out;
        }
        const bitmap = await createImageBitmap(blob).catch(() => null);
        if (bitmap) {
          const out = rasterize(bitmap, bitmap.width, bitmap.height, preserveAlpha);
          if (out) return out;
        }
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } else {
      console.warn('PDF image fetch returned non-OK', res.status, url);
    }
  } catch (e) {
    console.warn('PDF image fetch path failed, trying <img> fallback', url, e);
  }
  // Fallback: cross-origin <img> directly from the URL
  const img = await loadViaImageElement(url, true);
  if (!img) {
    console.warn('Failed to load image for PDF (all paths)', url);
    return null;
  }
  return rasterize(img, img.naturalWidth || img.width, img.naturalHeight || img.height, preserveAlpha);
}

/**
 * Render any cell's stored string value to plain text suitable for the PDF.
 * Mirrors the on-screen formatting per column type.
 */
function renderCell(
  col: BoardColumn,
  raw: string,
  files: BoardCellFile[],
  formulaContext?: FormulaContext
): string {
  if (col.type === 'files') {
    // Images are drawn graphically in didDrawCell — only show names for non-image attachments.
    const docs = files.filter((f) => !isImageFileName(f.file_name));
    if (docs.length === 0) return '';
    return docs.map((f) => f.file_name).join(', ');
  }

  if (col.type === 'connect') {
    if (!raw) return '';
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((p: any) => (typeof p === 'string' ? p : p?.label ?? ''))
          .filter(Boolean)
          .join(', ');
      }
    } catch {
      // fall through
    }
    return raw;
  }

  if (col.type === 'checkbox') {
    return raw === 'true' ? '✓' : '';
  }

  if (col.type === 'status') {
    const { option } = resolveSelectedStatus(raw, col.options, col.per_row_options);
    return option?.label || '';
  }

  if (col.type === 'date') {
    if (!raw) return '';
    // Stored as ISO yyyy-mm-dd or similar — keep as-is for clarity
    return raw;
  }

  if (col.type === 'item') {
    if (!raw) return '';
    try {
      const j = JSON.parse(raw);
      if (j && j.n) return j.s ? `${j.n} (${j.s})` : j.n;
    } catch {
      /* fall through */
    }
    return '';
  }

  // Text / Price / default — evaluate formulas to their computed value (matches on-screen).
  if (col.type === 'price') {
    if (!raw) return '';
    if (formulaContext && isFormula(raw)) {
      const result = evaluateFormula(raw, formulaContext);
      if (typeof result === 'number') return formatCurrencyPdf(result);
      return formatFormulaResult(result);
    }
    const n = Number(raw);
    return Number.isFinite(n) ? formatCurrencyPdf(n) : raw;
  }
  if (formulaContext && isFormula(raw)) {
    return formatFormulaResult(evaluateFormula(raw, formulaContext));
  }
  return raw || '';
}

// Tailwind-ish status colors mapped to RGB tuples for jsPDF cell fill.
const STATUS_FILL: Record<string, [number, number, number]> = {
  green: [220, 252, 231],
  blue: [219, 234, 254],
  red: [254, 226, 226],
  yellow: [254, 249, 195],
  orange: [255, 237, 213],
  purple: [237, 233, 254],
  pink: [252, 231, 243],
  gray: [229, 231, 235],
  slate: [226, 232, 240],
  teal: [204, 251, 241],
};

export async function generateBoardPdf(opts: GenerateOpts): Promise<void> {
  const { boardName, columns, groups, getCellValue, getCellTextAlign, getCellBgColor, getFiles, merges = [], logoUrl, refreshFileUrl } = opts;

  // Preload every image referenced in any "files" cell so we can embed them.
  const imageCache = new Map<string, LoadedImage>();
  const allImageFiles: BoardCellFile[] = [];
  for (const g of groups) {
    for (const r of g.rows) {
      for (const c of columns) {
        if (c.type !== 'files') continue;
        for (const f of getFiles(r.id, c.id)) {
          if (isImageFileName(f.file_name)) allImageFiles.push(f);
        }
      }
    }
  }
  // Cap concurrency to keep PDF generation snappy
  const CHUNK = 6;
  for (let i = 0; i < allImageFiles.length; i += CHUNK) {
    const slice = allImageFiles.slice(i, i + CHUNK);
    const loaded = await Promise.all(
      slice.map(async (f) => {
        // Always try a fresh signed URL first — stored URLs can expire or be blocked.
        const freshUrl = refreshFileUrl ? await refreshFileUrl(f.id).catch(() => null) : null;
        const candidates = [freshUrl, f.file_url].filter((u): u is string => !!u);
        for (const url of candidates) {
          const img = await loadImageForPdf(url);
          if (img) return img;
          console.warn('Board PDF: failed to load image, trying next URL', f.file_name, url);
        }
        console.warn('Board PDF: no working URL for image', f.file_name, f.id);
        return null;
      })
    );
    slice.forEach((f, idx) => {
      const img = loaded[idx];
      if (img) imageCache.set(f.id, img);
    });
  }

  // Preload logo (if any) in parallel-friendly fashion
  const logoImage = logoUrl ? await loadImageForPdf(logoUrl, true) : null;
  if (logoUrl && !logoImage) {
    console.warn('Board PDF: logo URL was provided but could not be rendered', logoUrl);
  }

  // Portrait A4 — fit all columns to upright page width
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const sideMargin = 40;
  const availableWidth = pageWidth - sideMargin * 2;
  const dynamicFontSize = columns.length > 6 ? 8 : 9;

  // Header — logo (left), title, generated date (right)
  let headerBottom = 40;
  if (logoImage) {
    const maxH = 40;
    const maxW = 90;
    const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height, 1);
    const lw = logoImage.width * scale;
    const lh = logoImage.height * scale;
    try {
      doc.addImage(logoImage.dataUrl, logoImage.format, sideMargin, 20, lw, lh, undefined, 'FAST');
      headerBottom = Math.max(headerBottom, 20 + lh);
    } catch (e) {
      console.warn('Failed to render logo on PDF', e);
    }
  }

  const titleX = logoImage ? sideMargin + 100 : 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(boardName || 'Board', titleX, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const generatedLabel = `Generated ${new Date().toLocaleString()}`;
  doc.text(generatedLabel, pageWidth - 40, 40, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  const head: RowInput[] = [columns.map((c) => c.name || '')];
  const colIds = columns.map((c) => c.id);

  // Build a formula context that mirrors the on-screen rendering order so
  // refs like A1, B2 resolve to the same cells as in the UI.
  const allRowIds: string[] = groups.flatMap((g) => g.rows.map((r) => r.id));
  const formulaContext: FormulaContext = {
    colCount: colIds.length,
    rowCount: allRowIds.length,
    getValueAt: (col, row) => {
      const colId = colIds[col];
      const rowId = allRowIds[row];
      if (!colId || !rowId) return '';
      return getCellValue(rowId, colId);
    },
  };

  // Map column index -> column for the cell hook (so we can color status pills)
  const columnByIdx = new Map<number, BoardColumn>();
  columns.forEach((c, i) => columnByIdx.set(i, c));

  // Track which body cells should be tinted as status pills.
  // Key: `${groupIdx}-${rowIdx}-${colIdx}` -> color name
  const statusFills = new Map<string, string>();
  // Per-cell alignment overrides. Key matches statusFills.
  const cellAligns = new Map<string, 'left' | 'center' | 'right'>();
  // Per-cell custom background colors set by the user (token like "blue-300").
  const colorFills = new Map<string, string>();
  // Per-cell list of image files to render inside the cell.
  const imageCells = new Map<string, BoardCellFile[]>();

  // Image rendering constants (used by both minCellHeight + didDrawCell)
  const IMG_GAP = 4;
  const IMG_CAPTION_H = 9;
  const IMG_CELL_PAD = 4;

  let cursorY = Math.max(60, headerBottom + 16);

  groups.forEach((group, gIdx) => {
    if (group.label) {
      // Group header row spanning the table — render via a one-cell sub-table
      autoTable(doc, {
        startY: cursorY,
        head: [],
        body: [[group.label]],
        theme: 'plain',
        tableWidth: availableWidth,
        styles: {
          fillColor: [243, 244, 246],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
        },
        margin: { left: sideMargin, right: sideMargin },
      });
      cursorY = (doc as any).lastAutoTable.finalY;
    }

    if (group.rows.length === 0) {
      cursorY += 4;
      return;
    }

    // Compute merge geometry scoped to this group's rows + the visible columns.
    const groupRowIds = group.rows.map((r) => r.id);
    const groupRects = computeMergeRects(merges, groupRowIds, colIds);
    const geometry = buildCellGeometryMap(groupRects, groupRowIds, colIds);

    const body: RowInput[] = group.rows.map((row, rIdx) => {
      const rowCells: Array<string | CellDef> = [];
      columns.forEach((col, cIdx) => {
        const key = `${row.id}::${col.id}`;
        const geo = geometry.get(key);
        if (geo?.hidden) return; // covered by another anchor cell — skip in autoTable

        const raw = getCellValue(row.id, col.id);
        const files = col.type === 'files' ? getFiles(row.id, col.id) : [];
        const text = renderCell(col, raw, files, formulaContext);

        if (col.type === 'files') {
          const imgs = files
            .filter((f) => isImageFileName(f.file_name) && imageCache.has(f.id))
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          if (imgs.length) imageCells.set(`${gIdx}-${rIdx}-${cIdx}`, imgs);
        }

        if (col.type === 'status' && raw) {
          const { option } = resolveSelectedStatus(raw, col.options, col.per_row_options);
          if (option?.color && option.color !== 'none') {
            statusFills.set(`${gIdx}-${rIdx}-${cIdx}`, option.color);
          }
        }
        const cellAlign = getCellTextAlign?.(row.id, col.id) ?? null;
        if (cellAlign) {
          cellAligns.set(`${gIdx}-${rIdx}-${cIdx}`, cellAlign);
        }
        const bgToken = getCellBgColor?.(row.id, col.id) ?? null;
        if (bgToken) {
          colorFills.set(`${gIdx}-${rIdx}-${cIdx}`, bgToken);
        }

        if (geo?.span) {
          rowCells.push({
            content: text,
            rowSpan: geo.span.rowSpan,
            colSpan: geo.span.colSpan,
          });
        } else {
          rowCells.push(text);
        }
      });
      return rowCells as RowInput;
    });

    autoTable(doc, {
      startY: cursorY,
      head,
      body,
      theme: 'grid',
      tableWidth: availableWidth,
      styles: {
        fontSize: dynamicFontSize,
        cellPadding: 5,
        overflow: 'linebreak',
        valign: 'top',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.75,
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.75,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252],
      },
      margin: { left: sideMargin, right: sideMargin },
      didParseCell: (data: CellHookData) => {
        const col = columnByIdx.get(data.column.index);
        if (col) {
          data.cell.styles.halign = col.text_align || (col.type === 'price' ? 'right' : 'left');
        }
        // Header row: paint the per-column header background color the user set.
        if (data.section === 'head' && col?.header_bg_color) {
          const rgb = cellColorToRgb(col.header_bg_color);
          if (rgb) {
            data.cell.styles.fillColor = rgb;
            const text = readableTextColor(col.header_bg_color);
            data.cell.styles.textColor = text === '#ffffff' ? [255, 255, 255] : [0, 0, 0];
          }
        }
        if (data.section !== 'body') return;
        const key = `${gIdx}-${data.row.index}-${data.column.index}`;
        const colorName = statusFills.get(key);
        if (colorName) {
          const fill = STATUS_FILL[colorName] || STATUS_FILL.gray;
          data.cell.styles.fillColor = fill;
          data.cell.styles.fontStyle = 'bold';
        }
        const overrideAlign = cellAligns.get(key);
        if (overrideAlign) {
          data.cell.styles.halign = overrideAlign;
        }
        // User-set background colors override status pill colors so the PDF
        // matches what the user sees on screen.
        const bgToken = colorFills.get(key);
        if (bgToken) {
          const rgb = cellColorToRgb(bgToken);
          if (rgb) {
            data.cell.styles.fillColor = rgb;
            const text = readableTextColor(bgToken);
            if (text === '#ffffff') {
              data.cell.styles.textColor = [255, 255, 255];
            } else {
              data.cell.styles.textColor = [0, 0, 0];
            }
          }
        }

        // Reserve vertical space for image stacks in files cells.
        const imgs = imageCells.get(key);
        if (imgs && imgs.length) {
          const cellInnerWidth = data.cell.width - IMG_CELL_PAD * 2;
          let total = IMG_CELL_PAD;
          for (const f of imgs) {
            const img = imageCache.get(f.id)!;
            const scale = Math.min(1, cellInnerWidth / img.width);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            total += drawH + (f.caption ? IMG_CAPTION_H : 0) + IMG_GAP;
          }
          // Cap so a single mega-row doesn't blow past one page
          const maxH = doc.internal.pageSize.getHeight() - 120;
          data.cell.styles.minCellHeight = Math.min(total, maxH);
        }
      },
      didDrawCell: (data: CellHookData) => {
        if (data.section !== 'body') return;
        const key = `${gIdx}-${data.row.index}-${data.column.index}`;
        const imgs = imageCells.get(key);
        if (!imgs || !imgs.length) return;

        const cellX = data.cell.x + IMG_CELL_PAD;
        const cellY = data.cell.y + IMG_CELL_PAD;
        const cellInnerWidth = data.cell.width - IMG_CELL_PAD * 2;
        const cellMaxBottom = data.cell.y + data.cell.height - IMG_CELL_PAD;
        let y = cellY;

        for (const f of imgs) {
          const img = imageCache.get(f.id);
          if (!img) continue;
          const scale = Math.min(1, cellInnerWidth / img.width);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          if (y + drawH > cellMaxBottom) break; // prevent overflow
          try {
            doc.addImage(img.dataUrl, img.format, cellX, y, drawW, drawH, undefined, 'FAST');
          } catch (e) {
            console.warn('addImage failed', e);
          }
          y += drawH;
          if (f.caption) {
            const captionBottom = y + IMG_CAPTION_H;
            if (captionBottom <= cellMaxBottom) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(7);
              doc.setTextColor(80, 80, 80);
              doc.text(f.caption, cellX, y + 7, { maxWidth: cellInnerWidth });
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);
              y = captionBottom;
            }
          }
          y += IMG_GAP;
        }
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 12;
  });

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 40,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'right' }
    );
    doc.setTextColor(0);
  }

  const safeName = (boardName || 'board').replace(/[^a-z0-9-_]+/gi, '_');
  await savePdfBlob(doc, `${safeName}.pdf`);
}
