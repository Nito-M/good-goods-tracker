import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/utils';
import { savePdfBlob } from '@/lib/pdfSave';

export interface AssemblyPdfData {
  name: string;
  description: string | null;
  sellingPrice: number;
  status: string;
  statusNotes: string | null;
  totalCost: number;
  hidePrices?: boolean;
  items: {
    itemName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    notes: string | null;
  }[];
}

export function generateAssemblyPDF(assembly: AssemblyPdfData) {
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
  if (assembly.description) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const descLines = doc.splitTextToSize(assembly.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 3;
  }

  // Selling Price & Cost
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  if (!assembly.hidePrices) {
    if (assembly.sellingPrice > 0) {
      doc.text(`Selling Price: ${formatCurrency(assembly.sellingPrice)}`, margin, y);
      y += 5;
    }
    if (assembly.totalCost > 0) {
      doc.text(`Total Cost: ${formatCurrency(assembly.totalCost)}`, margin, y);
      y += 5;
    }
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

  // Table columns - adjust based on hidePrices
  const hp = !!assembly.hidePrices;
  const col1X = margin;
  const col2X = margin + 70;
  const col3X = margin + 105;
  const col4X = hp ? col3X + 18 : margin + 123;
  const col5X = hp ? col4X : margin + 148;
  const notesX = hp ? col4X : col5X;
  const tableRight = pageWidth - margin;

  const nameColW = col2X - col1X - 4;
  const skuColW = col3X - col2X - 4;
  const notesColW = tableRight - notesX - 2;

  const headerH = 8;
  const rowPadding = 3;

  const drawTableHeader = (yPos: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(col1X, yPos, tableRight - col1X, headerH, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const textY = yPos + 5.5;
    doc.text('Item Name', col1X + 2, textY);
    doc.text('SKU', col2X + 2, textY);
    doc.text('Qty', col3X + 2, textY);
    if (!hp) doc.text('Unit Cost', col5X - 25 + 2, textY);
    doc.text('Notes', notesX + 2, textY);

    doc.setDrawColor(180, 180, 180);
    doc.line(col1X, yPos, tableRight, yPos);
    doc.line(col1X, yPos + headerH, tableRight, yPos + headerH);
    doc.line(col1X, yPos, col1X, yPos + headerH);
    doc.line(col2X, yPos, col2X, yPos + headerH);
    doc.line(col3X, yPos, col3X, yPos + headerH);
    if (!hp) doc.line(col5X - 25, yPos, col5X - 25, yPos + headerH);
    doc.line(notesX, yPos, notesX, yPos + headerH);
    doc.line(tableRight, yPos, tableRight, yPos + headerH);

    return yPos + headerH;
  };

  y = drawTableHeader(y);

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const item of assembly.items) {
    const nameLines = doc.splitTextToSize(item.itemName, nameColW);
    const skuLines = doc.splitTextToSize(item.sku || '—', skuColW);
    const notesLines = item.notes ? doc.splitTextToSize(item.notes, notesColW) : [];
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
    doc.text(nameLines, col1X + 2, textY);
    doc.text(skuLines, col2X + 2, textY);
    doc.text(String(item.quantity), col3X + 2, textY);
    if (!hp) doc.text(item.unitCost > 0 ? formatCurrency(item.unitCost) : '—', col5X - 25 + 2, textY);
    if (notesLines.length > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(notesLines, notesX + 2, textY);
      doc.setTextColor(0, 0, 0);
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(col1X, y + rowHeight, tableRight, y + rowHeight);
    doc.line(col1X, y, col1X, y + rowHeight);
    doc.line(col2X, y, col2X, y + rowHeight);
    doc.line(col3X, y, col3X, y + rowHeight);
    if (!hp) doc.line(col5X - 25, y, col5X - 25, y + rowHeight);
    doc.line(notesX, y, notesX, y + rowHeight);
    doc.line(tableRight, y, tableRight, y + rowHeight);

    y += rowHeight;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  await savePdfBlob(doc, `${assembly.name} - Parts List.pdf`);
}
