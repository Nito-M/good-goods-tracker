import jsPDF from 'jspdf';
import { formatCurrency } from '@/lib/utils';
import { savePdfBlob } from '@/lib/pdfSave';

export interface SopPdfSections {
  details: boolean;
  steps: boolean;
  bom: boolean;
  locations: boolean;
  attachments: boolean;
}

export const DEFAULT_SOP_PDF_SECTIONS: SopPdfSections = {
  details: true,
  steps: true,
  bom: true,
  locations: true,
  attachments: true,
};

export interface SopPdfData {
  title: string;
  sopNumber?: string | null;
  department?: string | null;
  revisionNumber?: string | null;
  category?: string | null;
  status?: string | null;
  effectiveDate?: string | null;
  lastUpdatedDate?: string | null;
  author?: string | null;
  approvedBy?: string | null;
  steps: {
    index: number;
    content: string | null;
    warnings?: string | null;
    notes?: string | null;
    tips?: string | null;
    requiredTools?: string | null;
    estimatedMinutes?: number | null;
    links?: { name?: string; url: string }[] | null;
    items?: { name: string; sku?: string | null; quantity: number; notes?: string | null }[];
  }[];
  bom: {
    name: string;
    sku?: string | null;
    quantity: number;
    unitCost: number;
    isOptional: boolean;
    notes?: string | null;
  }[];
  bomTotal: number;
  locations: { name: string; url?: string | null }[];
  attachments: { fileName: string }[];
}

export async function generateSopPDF(data: SopPdfData, sections: SopPdfSections) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionHeader = (label: string) => {
    ensureSpace(14);
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(label, margin + 3, y + 5.5);
    doc.setTextColor(0, 0, 0);
    y += 12;
  };

  const writeWrapped = (text: string, opts?: { size?: number; bold?: boolean; color?: [number, number, number] }) => {
    doc.setFontSize(opts?.size ?? 10);
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    if (opts?.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    }
  };

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(data.title, margin, y);
  y += 8;
  if (data.sopNumber) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`SOP #: ${data.sopNumber}`, margin, y);
    y += 6;
  }
  doc.setTextColor(0, 0, 0);
  y += 2;

  // Details
  if (sections.details) {
    sectionHeader('SOP Details');
    const rows: [string, string][] = [
      ['Department', data.department || '—'],
      ['Revision #', data.revisionNumber || '—'],
      ['Category', data.category || '—'],
      ['Status', data.status || '—'],
      ['Effective Date', data.effectiveDate || '—'],
      ['Last Updated', data.lastUpdatedDate || '—'],
      ['Author', data.author || '—'],
      ['Approved By', data.approvedBy || '—'],
    ];
    doc.setFontSize(10);
    const colW = contentWidth / 2;
    for (let i = 0; i < rows.length; i += 2) {
      ensureSpace(7);
      const [l1, v1] = rows[i];
      doc.setFont('helvetica', 'bold');
      doc.text(`${l1}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v1, margin + 32, y);
      if (rows[i + 1]) {
        const [l2, v2] = rows[i + 1];
        doc.setFont('helvetica', 'bold');
        doc.text(`${l2}:`, margin + colW, y);
        doc.setFont('helvetica', 'normal');
        doc.text(v2, margin + colW + 32, y);
      }
      y += 6;
    }
    y += 4;
  }

  // Steps
  if (sections.steps && data.steps.length) {
    sectionHeader('Procedure Steps');
    for (const s of data.steps) {
      ensureSpace(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const timeStr = s.estimatedMinutes != null
        ? s.estimatedMinutes >= 60 && s.estimatedMinutes % 60 === 0
          ? `  (${s.estimatedMinutes / 60}h)`
          : `  (${s.estimatedMinutes}m)`
        : '';
      doc.text(`Step ${s.index + 1}${timeStr}`, margin, y);
      y += 6;
      if (s.content) writeWrapped(s.content, { size: 10 });
      if (s.requiredTools) writeWrapped(`Tools: ${s.requiredTools}`, { size: 9, color: [60, 60, 60] });
      if (s.warnings) writeWrapped(`⚠ Warning: ${s.warnings}`, { size: 9, color: [180, 40, 40] });
      if (s.tips) writeWrapped(`💡 Tip: ${s.tips}`, { size: 9, color: [30, 100, 30] });
      if (s.notes) writeWrapped(`Note: ${s.notes}`, { size: 9, color: [80, 80, 80] });
      if (s.links && s.links.length) {
        for (const l of s.links) writeWrapped(`Link: ${l.name || l.url} — ${l.url}`, { size: 9, color: [40, 80, 160] });
      }
      if (s.items && s.items.length) {
        writeWrapped('Parts:', { size: 9, bold: true });
        for (const it of s.items) {
          writeWrapped(`  • ${it.name}${it.sku ? ` (#${it.sku})` : ''} × ${it.quantity}${it.notes ? ` — ${it.notes}` : ''}`, { size: 9 });
        }
      }
      y += 3;
    }
  }

  // BOM
  if (sections.bom && data.bom.length) {
    sectionHeader('Bill of Materials');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    ensureSpace(7);
    doc.text('Item', margin, y);
    doc.text('SKU', margin + 75, y);
    doc.text('Qty', margin + 110, y);
    doc.text('Cost', margin + 130, y);
    doc.text('Notes', margin + 155, y);
    y += 5;
    doc.setDrawColor(200);
    doc.line(margin, y - 2, margin + contentWidth, y - 2);
    doc.setFont('helvetica', 'normal');
    for (const b of data.bom) {
      const nameLines = doc.splitTextToSize(b.name + (b.isOptional ? ' (optional)' : ''), 70);
      const noteLines = b.notes ? doc.splitTextToSize(b.notes, 30) : [];
      const h = Math.max(nameLines.length, noteLines.length, 1) * 4.5 + 2;
      ensureSpace(h);
      doc.text(nameLines, margin, y);
      doc.text(b.sku || '—', margin + 75, y);
      doc.text(String(b.quantity), margin + 110, y);
      doc.text(formatCurrency(b.quantity * b.unitCost), margin + 130, y);
      if (noteLines.length) doc.text(noteLines, margin + 155, y);
      y += h;
    }
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Estimated Total: ${formatCurrency(data.bomTotal)}`, margin + contentWidth, y + 2, { align: 'right' });
    y += 8;
  }

  // Locations
  if (sections.locations && data.locations.length) {
    sectionHeader('Locations');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    for (const l of data.locations) {
      ensureSpace(6);
      doc.text(`• ${l.name}${l.url ? ` — ${l.url}` : ''}`, margin, y);
      y += 5;
    }
  }

  // Attachments
  if (sections.attachments && data.attachments.length) {
    sectionHeader('Attachments');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    for (const a of data.attachments) {
      ensureSpace(6);
      doc.text(`• ${a.fileName}`, margin, y);
      y += 5;
    }
  }

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated ${new Date().toLocaleDateString()} — Page ${i} of ${pages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  await savePdfBlob(doc, `${data.title} - SOP.pdf`);
}
