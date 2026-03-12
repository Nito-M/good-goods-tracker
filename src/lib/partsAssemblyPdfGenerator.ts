import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/utils';
import { savePdfBlob } from '@/lib/pdfSave';

export interface PartsAssemblyPdfData {
  name: string;
  description: string | null;
  sellingPrice: number;
  status: string;
  statusNotes: string | null;
  items: {
    partName: string;
    partSku: string;
    quantity: number;
    notes: string | null;
  }[];
}

export function generatePartsAssemblyPDF(assembly: PartsAssemblyPdfData) {
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

  // Status & Price line
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  if (assembly.sellingPrice > 0) {
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

  // Table columns - define edges for vertical lines
  const col1X = margin;           // Name start
  const col2X = margin + 85;      // SKU start
  const col3X = margin + 130;     // Qty start
  const col4X = margin + 148;     // Notes start
  const tableRight = pageWidth - margin;

  const nameColW = col2X - col1X - 4;
  const skuColW = col3X - col2X - 4;
  const notesColW = tableRight - col4X - 2;

  const headerH = 8;
  const rowPadding = 3;

  const drawTableHeader = (yPos: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(col1X, yPos, tableRight - col1X, headerH, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const textY = yPos + 5.5;
    doc.text('Part Name', col1X + 2, textY);
    doc.text('SKU', col2X + 2, textY);
    doc.text('Qty', col3X + 2, textY);
    doc.text('Notes', col4X + 2, textY);

    // Header border lines
    doc.setDrawColor(180, 180, 180);
    doc.line(col1X, yPos, tableRight, yPos); // top
    doc.line(col1X, yPos + headerH, tableRight, yPos + headerH); // bottom
    // Vertical lines
    doc.line(col1X, yPos, col1X, yPos + headerH);
    doc.line(col2X, yPos, col2X, yPos + headerH);
    doc.line(col3X, yPos, col3X, yPos + headerH);
    doc.line(col4X, yPos, col4X, yPos + headerH);
    doc.line(tableRight, yPos, tableRight, yPos + headerH);

    return yPos + headerH;
  };

  y = drawTableHeader(y);

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const item of assembly.items) {
    const nameLines = doc.splitTextToSize(item.partName, nameColW);
    const skuLines = doc.splitTextToSize(item.partSku || '—', skuColW);
    const notesLines = item.notes ? doc.splitTextToSize(item.notes, notesColW) : [];
    const rowLines = Math.max(nameLines.length, skuLines.length, notesLines.length, 1);
    const rowHeight = rowLines * 5 + rowPadding * 2;

    // Page break check
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
    if (notesLines.length > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(notesLines, col4X + 2, textY);
      doc.setTextColor(0, 0, 0);
    }

    // Row border: bottom line and vertical lines
    doc.setDrawColor(200, 200, 200);
    doc.line(col1X, y + rowHeight, tableRight, y + rowHeight); // bottom
    doc.line(col1X, y, col1X, y + rowHeight);       // left
    doc.line(col2X, y, col2X, y + rowHeight);       // col separator
    doc.line(col3X, y, col3X, y + rowHeight);       // col separator
    doc.line(col4X, y, col4X, y + rowHeight);       // col separator
    doc.line(tableRight, y, tableRight, y + rowHeight); // right

    y += rowHeight;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  await savePdfBlob(doc, `${assembly.name} - Parts List.pdf`);
}
