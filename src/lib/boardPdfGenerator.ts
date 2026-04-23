import jsPDF from 'jspdf';
import autoTable, { type RowInput, type CellHookData } from 'jspdf-autotable';
import type { BoardColumn, BoardRow } from '@/hooks/useBoard';
import type { BoardCellFile } from '@/hooks/useBoardCellFiles';
import { savePdfBlob } from '@/lib/pdfSave';
import { resolveSelectedStatus } from '@/lib/boardStatusValue';

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
  getFiles: (rowId: string, columnId: string) => BoardCellFile[];
}

/**
 * Render any cell's stored string value to plain text suitable for the PDF.
 * Mirrors the on-screen formatting per column type.
 */
function renderCell(
  col: BoardColumn,
  raw: string,
  files: BoardCellFile[]
): string {
  if (col.type === 'files') {
    if (files.length === 0) return '';
    return files.map((f) => f.file_name).join(', ');
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
  const { boardName, columns, groups, getCellValue, getCellTextAlign, getFiles } = opts;

  // Use landscape — boards usually have many columns
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(boardName || 'Board', 40, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  const generatedLabel = `Generated ${new Date().toLocaleString()}`;
  doc.text(generatedLabel, pageWidth - 40, 40, { align: 'right' });
  doc.setTextColor(0);

  const head: RowInput[] = [columns.map((c) => c.name || '')];

  // Map column index -> column for the cell hook (so we can color status pills)
  const columnByIdx = new Map<number, BoardColumn>();
  columns.forEach((c, i) => columnByIdx.set(i, c));

  // Track which body cells should be tinted as status pills.
  // Key: `${groupIdx}-${rowIdx}-${colIdx}` -> color name
  const statusFills = new Map<string, string>();
  // Per-cell alignment overrides. Key matches statusFills.
  const cellAligns = new Map<string, 'left' | 'center' | 'right'>();

  let cursorY = 60;

  groups.forEach((group, gIdx) => {
    if (group.label) {
      // Group header row spanning the table — render via a one-cell sub-table
      autoTable(doc, {
        startY: cursorY,
        head: [],
        body: [[group.label]],
        theme: 'plain',
        styles: {
          fillColor: [243, 244, 246],
          textColor: [55, 65, 81],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
        },
        margin: { left: 40, right: 40 },
      });
      cursorY = (doc as any).lastAutoTable.finalY;
    }

    if (group.rows.length === 0) {
      cursorY += 4;
      return;
    }

    const body: RowInput[] = group.rows.map((row, rIdx) =>
      columns.map((col, cIdx) => {
        const raw = getCellValue(row.id, col.id);
        const files = col.type === 'files' ? getFiles(row.id, col.id) : [];
        const text = renderCell(col, raw, files);
        if (col.type === 'status' && raw) {
          const { option } = resolveSelectedStatus(raw, col.options, col.per_row_options);
          if (option?.color) {
            statusFills.set(`${gIdx}-${rIdx}-${cIdx}`, option.color);
          }
        }
        const cellAlign = getCellTextAlign?.(row.id, col.id) ?? null;
        if (cellAlign) {
          cellAligns.set(`${gIdx}-${rIdx}-${cIdx}`, cellAlign);
        }
        return text;
      })
    );

    autoTable(doc, {
      startY: cursorY,
      head,
      body,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 5,
        overflow: 'linebreak',
        valign: 'top',
        lineColor: [0, 0, 0],
        lineWidth: 0.75,
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [55, 65, 81],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.75,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252],
      },
      margin: { left: 40, right: 40 },
      didParseCell: (data: CellHookData) => {
        const col = columnByIdx.get(data.column.index);
        if (col) {
          data.cell.styles.halign = col.text_align || 'left';
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
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 12;
  });

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
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
