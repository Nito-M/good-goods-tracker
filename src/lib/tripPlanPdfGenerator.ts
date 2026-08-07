import jsPDF from 'jspdf';
import { savePdfBlob } from '@/lib/pdfSave';

export interface TripPlanPdfPo {
  poNumber?: string | null;
  vendorName?: string | null;
  total?: number;
  isPaid?: boolean;
}

export interface TripPlanPdfLocation {
  name: string;
  address?: string | null;
  notes?: string | null;
  pos: TripPlanPdfPo[];
}

export interface TripPlanPdfData {
  title: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  locations: TripPlanPdfLocation[];
  tripPos: TripPlanPdfPo[];
  totals?: { total: number; paid: number; unpaid: number };
}

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function generateTripPlanPdf(data: TripPlanPdfData, mode: 'download' | 'print' = 'download') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (text: string, opts?: { size?: number; bold?: boolean; indent?: number }) => {
    const size = opts?.size ?? 10;
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const indent = opts?.indent ?? 0;
    const lines = doc.splitTextToSize(text, maxW - indent);
    const lh = size * 0.45 + 1.5;
    ensure(lines.length * lh);
    doc.text(lines, margin + indent, y);
    y += lines.length * lh;
  };

  write('Trip Plan', { size: 16, bold: true });
  y += 2;
  write(data.title, { size: 13, bold: true });
  write(`${data.startDate}${data.endDate ? ` → ${data.endDate}` : ''}`, { size: 10 });
  y += 2;
  doc.setDrawColor(180);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  if (data.notes) {
    write('Notes', { size: 11, bold: true });
    write(data.notes, { indent: 4 });
    y += 4;
  }

  const poLine = (po: TripPlanPdfPo) => {
    const parts = [po.poNumber ? `PO ${po.poNumber}` : 'PO'];
    if (po.vendorName) parts.push(po.vendorName);
    if (typeof po.total === 'number') parts.push(money(po.total));
    parts.push(po.isPaid ? 'Paid' : 'Unpaid');
    return `• ${parts.join(' — ')}`;
  };

  if (data.tripPos.length > 0) {
    write('Trip Purchase Orders', { size: 11, bold: true });
    data.tripPos.forEach((po) => write(poLine(po), { indent: 4 }));
    y += 4;
  }

  write('Locations', { size: 11, bold: true });
  if (data.locations.length === 0) {
    write('No locations added.', { indent: 4 });
  } else {
    data.locations.forEach((loc, i) => {
      ensure(12);
      write(`${i + 1}. ${loc.name}`, { size: 10, bold: true, indent: 2 });
      if (loc.address) write(loc.address, { indent: 8 });
      if (loc.notes) write(`Notes: ${loc.notes}`, { indent: 8 });
      loc.pos.forEach((po) => write(poLine(po), { indent: 8 }));
      y += 3;
    });
  }

  if (data.totals) {
    y += 2;
    ensure(20);
    doc.setDrawColor(180);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    write('Totals', { size: 11, bold: true });
    write(`Total: ${money(data.totals.total)}`, { indent: 4 });
    write(`Paid: ${money(data.totals.paid)}`, { indent: 4 });
    write(`Unpaid: ${money(data.totals.unpaid)}`, { indent: 4 });
  }

  const fileName = `trip-plan-${data.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  if (mode === 'print') {
    const url = doc.output('bloburl');
    window.open(url as unknown as string, '_blank');
    return;
  }
  savePdfBlob(doc, fileName);
}
