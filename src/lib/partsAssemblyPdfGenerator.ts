import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/utils';
import { savePdfBlob } from '@/lib/pdfSave';

export interface AssemblyPdfVisibility {
  partName: boolean;
  description: boolean;
  sellingPrice: boolean;
  sku: boolean;
  quantity: boolean;
  notes: boolean;
}

export const DEFAULT_ASSEMBLY_PDF_VISIBILITY: AssemblyPdfVisibility = {
  partName: true,
  sellingPrice: true,
  sku: true,
  quantity: true,
  notes: true,
};

export const ASSEMBLY_PDF_SETTINGS_KEY = 'assembly_pdf_visibility_2';

export function getAssemblyPdfVisibility(): AssemblyPdfVisibility {
  try {
    const stored = localStorage.getItem(ASSEMBLY_PDF_SETTINGS_KEY);
    if (stored) return { ...DEFAULT_ASSEMBLY_PDF_VISIBILITY, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_ASSEMBLY_PDF_VISIBILITY };
}

export interface PartsAssemblyPdfData {
  name: string;
  description: string | null;
  sellingPrice: number;
  status: string;
  statusNotes: string | null;
  visibility?: AssemblyPdfVisibility;
  items: {
    partName: string;
    partSku: string;
    quantity: number;
    notes: string | null;
  }[];
}

export async function generatePartsAssemblyPDF(assembly: PartsAssemblyPdfData) {
  const vis = assembly.visibility ?? getAssemblyPdfVisibility();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(assembly.name, margin, y);
  y += 10;

  // Description
  if (vis.description && assembly.description) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const descLines = doc.splitTextToSize(assembly.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 3;
  }

  // Selling Price
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  if (vis.sellingPrice && assembly.sellingPrice > 0) {
    doc.text(`Selling Price: ${formatCurrency(assembly.sellingPrice)}`, margin, y);
    y += 5;
  }

  y += 5;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Parts count
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Parts List (${assembly.items.length})`, margin, y);
  y += 8;

  // Build dynamic columns
  type Col = { label: string; x: number; w: number };
  const cols: Col[] = [];
  let cx = margin;
  const nameW = vis.sku ? 85 : (vis.quantity ? 110 : 130);
  cols.push({ label: 'Part Name', x: cx, w: nameW });
  cx += nameW;
  if (vis.sku) { const w = 45; cols.push({ label: 'SKU', x: cx, w }); cx += w; }
  if (vis.quantity) { const w = 18; cols.push({ label: 'Qty', x: cx, w }); cx += w; }
  if (vis.notes) { cols.push({ label: 'Notes', x: cx, w: pageWidth - margin - cx }); }
  const tableRight = pageWidth - margin;

  const headerH = 8;
  const rowPadding = 3;

  const drawTableHeader = (yPos: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, tableRight - margin, headerH, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const textY = yPos + 5.5;
    for (const c of cols) doc.text(c.label, c.x + 2, textY);
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, yPos, tableRight, yPos);
    doc.line(margin, yPos + headerH, tableRight, yPos + headerH);
    doc.line(margin, yPos, margin, yPos + headerH);
    for (const c of cols) doc.line(c.x, yPos, c.x, yPos + headerH);
    doc.line(tableRight, yPos, tableRight, yPos + headerH);
    return yPos + headerH;
  };

  y = drawTableHeader(y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const item of assembly.items) {
    const nameCol = cols.find(c => c.label === 'Part Name')!;
    const skuCol = cols.find(c => c.label === 'SKU');
    const notesCol = cols.find(c => c.label === 'Notes');

    const nameLines = doc.splitTextToSize(item.partName, nameCol.w - 4);
    const skuLines = skuCol ? doc.splitTextToSize(item.partSku || '—', skuCol.w - 4) : [];
    const notesLines = notesCol && item.notes ? doc.splitTextToSize(item.notes, notesCol.w - 4) : [];
    const rowLines = Math.max(nameLines.length, skuLines.length, notesLines.length, 1);
    const rowHeight = rowLines * 5 + rowPadding * 2;

    if (y + rowHeight > pageHeight - 25) {
      doc.addPage();
      y = margin;
      y = drawTableHeader(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }

    const textY = y + rowPadding + 4;
    doc.setTextColor(0, 0, 0);
    doc.text(nameLines, nameCol.x + 2, textY);
    if (skuCol) doc.text(skuLines, skuCol.x + 2, textY);
    const qtyCol = cols.find(c => c.label === 'Qty');
    if (qtyCol) doc.text(String(item.quantity), qtyCol.x + 2, textY);
    if (notesCol && notesLines.length > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(notesLines, notesCol.x + 2, textY);
      doc.setTextColor(0, 0, 0);
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + rowHeight, tableRight, y + rowHeight);
    doc.line(margin, y, margin, y + rowHeight);
    for (const c of cols) doc.line(c.x, y, c.x, y + rowHeight);
    doc.line(tableRight, y, tableRight, y + rowHeight);

    y += rowHeight;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  await savePdfBlob(doc, `${assembly.name} - Parts List.pdf`);
}
