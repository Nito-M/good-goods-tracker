import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/utils';

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
  const statusText = assembly.status === 'finished' ? 'Finished' : 'Not Finished';
  const priceText = assembly.sellingPrice > 0 ? `Selling Price: ${formatCurrency(assembly.sellingPrice)}` : '';
  doc.text(`Status: ${statusText}${priceText ? '    |    ' + priceText : ''}`, margin, y);
  y += 5;

  if (assembly.status !== 'finished' && assembly.statusNotes) {
    doc.setTextColor(100, 100, 100);
    const noteLines = doc.splitTextToSize(`Note: ${assembly.statusNotes}`, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 5;
    doc.setTextColor(0, 0, 0);
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

  // Table header
  const colX = {
    name: margin + 2,
    sku: margin + 85,
    qty: margin + 130,
    notes: margin + 148,
  };
  const nameColW = 80;
  const skuColW = 42;
  const notesColW = contentWidth - 148;

  const drawTableHeader = (yPos: number) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 4, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Part Name', colX.name, yPos);
    doc.text('SKU', colX.sku, yPos);
    doc.text('Qty', colX.qty, yPos);
    doc.text('Notes', colX.notes, yPos);
    return yPos + 10;
  };

  y = drawTableHeader(y);

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (const item of assembly.items) {
    const nameLines = doc.splitTextToSize(item.partName, nameColW);
    const skuLines = doc.splitTextToSize(item.partSku || '—', skuColW);
    const notesLines = item.notes ? doc.splitTextToSize(item.notes, notesColW) : [];
    const rowLines = Math.max(nameLines.length, skuLines.length, notesLines.length || 1);
    const rowHeight = rowLines * 5 + 2;

    // Page break check
    if (y + rowHeight > pageHeight - 25) {
      doc.addPage();
      y = margin;
      y = drawTableHeader(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }

    doc.text(nameLines, colX.name, y);
    doc.text(skuLines, colX.sku, y);
    doc.text(String(item.quantity), colX.qty, y);
    if (notesLines.length > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text(notesLines, colX.notes, y);
      doc.setTextColor(0, 0, 0);
    }

    y += rowHeight;

    // Light row separator
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 1, pageWidth - margin, y - 1);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`${assembly.name} - Parts List.pdf`);
}
