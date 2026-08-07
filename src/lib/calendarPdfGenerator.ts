import jsPDF from 'jspdf';
import { savePdfBlob } from '@/lib/pdfSave';

export interface CalendarPdfSections {
  events: boolean;
  trips: boolean;
  jobs: boolean;
  requests: boolean;
  todos: boolean;
}

export const DEFAULT_CALENDAR_PDF_SECTIONS: CalendarPdfSections = {
  events: true,
  trips: true,
  jobs: true,
  requests: true,
  todos: true,
};

export interface CalendarPdfEntry {
  kind: keyof CalendarPdfSections;
  title: string;
  detail?: string;
}

export interface CalendarPdfDay {
  /** Pre-formatted date heading, e.g. "Mon, Aug 10" */
  label: string;
  entries: CalendarPdfEntry[];
}

const KIND_LABEL: Record<keyof CalendarPdfSections, string> = {
  events: 'Event',
  trips: 'Plan',
  jobs: 'Job',
  requests: 'Request',
  todos: 'To-do',
};

export function generateCalendarPdf(
  monthLabel: string,
  days: CalendarPdfDay[],
  sections: CalendarPdfSections,
  mode: 'download' | 'print' = 'download',
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Planned Schedule', margin, y);
  y += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(monthLabel, margin, y);
  y += 4;
  doc.setDrawColor(180);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  const filtered = days
    .map((d) => ({ ...d, entries: d.entries.filter((e) => sections[e.kind]) }))
    .filter((d) => d.entries.length > 0);

  if (filtered.length === 0) {
    doc.setFontSize(11);
    doc.text('Nothing planned for this period.', margin, y);
  }

  for (const day of filtered) {
    ensure(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(day.label, margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const entry of day.entries) {
      const prefix = `[${KIND_LABEL[entry.kind]}] `;
      const text = prefix + entry.title + (entry.detail ? ` — ${entry.detail}` : '');
      const lines = doc.splitTextToSize(text, pageW - margin * 2 - 5);
      ensure(lines.length * 5 + 2);
      doc.text(lines, margin + 4, y);
      y += lines.length * 5;
    }
    y += 4;
  }

  const fileName = `planned-schedule-${monthLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`;

  if (mode === 'print') {
    const url = doc.output('bloburl');
    window.open(url as unknown as string, '_blank');
    return;
  }
  savePdfBlob(doc, fileName);
}
