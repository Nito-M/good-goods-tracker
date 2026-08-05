import jsPDF from 'jspdf';
import { Quote, QuoteSettings } from '@/types/quote';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import { formatCurrencyPdf as formatCurrency } from '@/lib/utils';
import { savePdfBlob } from '@/lib/pdfSave';

const PAGE_MARGIN_BOTTOM = 30;
const LINE_HEIGHT = 4.5;

export interface PackingSlipRow {
  itemName: string;
  vin: string;
  stockNumber: string;
  jobNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PackingSlipOptions {
  includePrices: boolean;
  rows: PackingSlipRow[];
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export const generatePackingSlipPDF = async (
  quote: Quote,
  settings: QuoteSettings,
  options: PackingSlipOptions
) => {
  const { includePrices, rows } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const safeBottom = pageHeight - PAGE_MARGIN_BOTTOM;
  const layout: InvoiceLayout = { ...defaultInvoiceLayout, ...(settings.layout || {}) };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const getXPosition = (elementX: number, align?: string) => {
    if (align === 'right') return pageWidth - 20;
    if (align === 'center') return pageWidth / 2;
    return elementX;
  };

  const tableX = 20;
  const tableRight = pageWidth - 20;

  // Column layout (absolute mm)
  const colName = tableX + 2;
  const colVin = includePrices ? tableX + 46 : tableX + 66;
  const colStock = includePrices ? tableX + 82 : tableX + 118;
  const colJob = includePrices ? tableX + 100 : tableX + 138;
  const colQty = includePrices ? tableX + 120 : tableX + 160;
  const colPrice = tableX + 145;
  const colTotal = tableRight - 2;

  const nameWidth = includePrices ? 42 : 62;
  const vinWidth = includePrices ? 34 : 50;

  const drawTableHeader = (y: number): number => {
    doc.setFillColor(240, 240, 240);
    doc.rect(tableX, y - 5, tableRight - tableX, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Item / Trailer', colName, y);
    doc.text('VIN', colVin, y);
    doc.text('Stock #', colStock, y);
    doc.text('Job #', colJob, y);
    doc.text('Qty', colQty, y, { align: 'center' });
    if (includePrices) {
      doc.text('Price', colPrice, y, { align: 'right' });
      doc.text('Total', colTotal, y, { align: 'right' });
    }
    doc.setFont('helvetica', 'normal');
    return y + 9;
  };

  let flowY = 20;

  // Logo
  if (settings.logoUrl && layout.logo.visible) {
    try {
      const img = await loadImage(settings.logoUrl);
      const maxSize = 160 * 0.352778;
      let imgWidth = maxSize;
      let imgHeight = maxSize;
      const aspectRatio = img.width / img.height;
      if (aspectRatio > 1) imgHeight = imgWidth / aspectRatio;
      else imgWidth = imgHeight * aspectRatio;
      doc.addImage(img, 'PNG', layout.logo.x, layout.logo.y - 10, imgWidth, imgHeight);
      flowY = Math.max(flowY, layout.logo.y + imgHeight + 2);
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
  }

  // Business info
  if (
    layout.businessInfo.visible &&
    (settings.businessName || settings.businessAddress || settings.businessPhone || settings.businessEmail)
  ) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const align = (layout.businessInfo.align || 'right') as 'left' | 'center' | 'right';
    const xPos = getXPosition(layout.businessInfo.x, align);
    let businessY = layout.businessInfo.y;

    if (settings.businessName) {
      doc.setFont('helvetica', 'bold');
      doc.text(settings.businessName, xPos, businessY, { align });
      businessY += 5;
      doc.setFont('helvetica', 'normal');
    }
    if (settings.businessAddress) {
      settings.businessAddress.split('\n').forEach((line) => {
        doc.text(line, xPos, businessY, { align });
        businessY += 5;
      });
    }
    if (settings.businessPhone) {
      doc.text(settings.businessPhone, xPos, businessY, { align });
      businessY += 5;
    }
    if (settings.businessEmail) {
      doc.text(settings.businessEmail, xPos, businessY, { align });
      businessY += 5;
    }
    flowY = Math.max(flowY, businessY + 2);
  }

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PACKING / DELIVERY SLIP', pageWidth / 2, flowY, { align: 'center' });
  flowY += 12;

  // Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const soNumber = quote.salesOrderNumber || quote.quoteNumber;
  doc.text(`Sales Order #: ${soNumber}`, tableX, flowY);
  let leftY = flowY + 6;
  if (quote.quoteNumber) {
    doc.text(`Quote #: ${quote.quoteNumber}`, tableX, leftY);
    leftY += 6;
  }
  doc.text(`Date: ${formatDate(new Date().toISOString())}`, tableX, leftY);
  leftY += 6;

  // Ship To (right)
  let rightY = flowY;
  if (quote.vendorName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Ship To:', tableRight, rightY, { align: 'right' });
    rightY += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(quote.vendorName, tableRight, rightY, { align: 'right' });
    rightY += 6;
    if (quote.contactPersonName) {
      doc.text(`Attn: ${quote.contactPersonName}`, tableRight, rightY, { align: 'right' });
      rightY += 5;
    }
    if (quote.vendorAddress) {
      quote.vendorAddress.split('\n').forEach((line) => {
        doc.text(line, tableRight, rightY, { align: 'right' });
        rightY += 5;
      });
    }
  }

  flowY = Math.max(leftY, rightY) + 8;

  // Items table
  let y = drawTableHeader(flowY);
  doc.setFontSize(9);
  let grandTotal = 0;
  let totalQty = 0;

  rows.forEach((row, idx) => {
    const nameLines = doc.splitTextToSize(row.itemName || '-', nameWidth);
    const vinLines = doc.splitTextToSize(row.vin || '', vinWidth);
    const rowLines = Math.max(nameLines.length, vinLines.length, 1);
    const rowHeight = rowLines * LINE_HEIGHT + 3;

    if (idx > 0 && y + rowHeight > safeBottom) {
      doc.addPage();
      y = drawTableHeader(20);
      doc.setFontSize(9);
    }

    doc.setTextColor(0, 0, 0);
    doc.text(nameLines, colName, y);
    if (row.vin) {
      doc.text(vinLines, colVin, y);
    } else {
      // blank underline to fill in by hand
      doc.setDrawColor(180, 180, 180);
      doc.line(colVin, y + 1, colVin + vinWidth, y + 1);
    }
    doc.setTextColor(90, 90, 90);
    doc.text(row.stockNumber || '—', colStock, y);
    doc.text(row.jobNumber || '—', colJob, y);
    doc.setTextColor(0, 0, 0);
    doc.text(String(row.quantity), colQty, y, { align: 'center' });
    if (includePrices) {
      doc.text(formatCurrency(row.unitPrice), colPrice, y, { align: 'right' });
      doc.text(formatCurrency(row.totalPrice), colTotal, y, { align: 'right' });
    }

    grandTotal += row.totalPrice;
    totalQty += row.quantity;

    y += rowHeight;
    doc.setDrawColor(210, 210, 210);
    doc.line(tableX, y - 2, tableRight, y - 2);
    y += 2;
  });

  // Totals
  y += 4;
  if (y + 20 > safeBottom) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Units: ${totalQty}`, tableX, y);
  if (includePrices) {
    doc.text('TOTAL:', colPrice, y, { align: 'right' });
    doc.text(formatCurrency(grandTotal), colTotal, y, { align: 'right' });
  }
  doc.setFont('helvetica', 'normal');
  y += 18;

  // Signature block
  if (y + 30 > safeBottom) {
    doc.addPage();
    y = 40;
  }
  doc.setFontSize(9);
  doc.setDrawColor(120, 120, 120);
  const sigWidth = (tableRight - tableX - 20) / 3;
  const labels = ['Delivered By', 'Received By', 'Date'];
  labels.forEach((label, i) => {
    const x = tableX + i * (sigWidth + 10);
    doc.line(x, y, x + sigWidth, y);
    doc.setTextColor(90, 90, 90);
    doc.text(label, x, y + 5);
    doc.setTextColor(0, 0, 0);
  });

  // Footer on every page
  const totalPages = (doc.internal as any).getNumberOfPages?.() ?? doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Packing slip — ${soNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Page ${p} of ${totalPages}`, tableRight, pageHeight - 10, { align: 'right' });
  }

  await savePdfBlob(doc, `PackingSlip-${soNumber}.pdf`);
};
