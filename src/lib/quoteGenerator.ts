import jsPDF from 'jspdf';
import { Quote, QuoteSettings } from '@/types/quote';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import { formatCurrency } from '@/lib/utils';
import { savePdfBlob } from '@/lib/pdfSave';

const PAGE_MARGIN_BOTTOM = 20; // mm from bottom edge where we trigger a new page
const LINE_HEIGHT = 7;
const NOTE_LINE_HEIGHT = 4;

export const generateQuotePDF = async (quote: Quote, settings: QuoteSettings) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const safeBottom = pageHeight - PAGE_MARGIN_BOTTOM;
  const layout: InvoiceLayout = { ...defaultInvoiceLayout, ...(settings.layout || {}) };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getXPosition = (elementX: number, align?: string) => {
    if (align === 'right') return pageWidth - 20;
    if (align === 'center') return pageWidth / 2;
    return elementX;
  };

  /** Add a new page and reset y, re-drawing the table header if inside items block */
  const addPageWithHeader = (insideTable: boolean, tableX: number): number => {
    doc.addPage();
    let y = 20;
    if (insideTable) {
      doc.setFillColor(240, 240, 240);
      doc.rect(tableX, y - 4, pageWidth - tableX - 20, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Item', tableX + 2, y);
      doc.text('SKU', tableX + 72, y);
      doc.text('Qty', tableX + 105, y, { align: 'center' });
      if (!quote.hidePrices) {
        doc.text('Price', tableX + 145, y, { align: 'right' });
        doc.text('Total', pageWidth - 22, y, { align: 'right' });
      }
      doc.setFont('helvetica', 'normal');
      y += 10;
    }
    return y;
  };

  let flowY = 20;

  // Add logo if available and visible
  if (settings.logoUrl && layout.logo.visible) {
    try {
      const img = await loadImage(settings.logoUrl);
      const maxSize = 160 * 0.352778;
      let imgWidth = maxSize;
      let imgHeight = maxSize;

      const aspectRatio = img.width / img.height;
      if (aspectRatio > 1) {
        imgHeight = imgWidth / aspectRatio;
      } else {
        imgWidth = imgHeight * aspectRatio;
      }

      const logoY = layout.logo.y - 10; // push logo higher
      doc.addImage(img, 'PNG', layout.logo.x, logoY, imgWidth, imgHeight);
      flowY = Math.max(flowY, layout.logo.y + imgHeight + 2);
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
  }

  // Business Info
  if (layout.businessInfo.visible && (settings.businessName || settings.businessAddress || settings.businessPhone || settings.businessEmail || settings.businessNumber)) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const align = layout.businessInfo.align || 'right';
    const xPos = getXPosition(layout.businessInfo.x, align);
    let businessY = layout.businessInfo.y;

    if (settings.businessName) {
      doc.setFont('helvetica', 'bold');
      doc.text(settings.businessName, xPos, businessY, { align: align as 'left' | 'center' | 'right' });
      businessY += 5;
      doc.setFont('helvetica', 'normal');
    }
    if (settings.businessAddress) {
      const addressLines = settings.businessAddress.split('\n');
      addressLines.forEach((line) => {
        doc.text(line, xPos, businessY, { align: align as 'left' | 'center' | 'right' });
        businessY += 5;
      });
    }
    if (settings.businessPhone) {
      doc.text(settings.businessPhone, xPos, businessY, { align: align as 'left' | 'center' | 'right' });
      businessY += 5;
    }
    if (settings.businessEmail) {
      doc.text(settings.businessEmail, xPos, businessY, { align: align as 'left' | 'center' | 'right' });
      businessY += 5;
    }

    flowY = Math.max(flowY, businessY + 2);
  }

  // Quote Title
  if (layout.invoiceTitle.visible) {
    const titleY = layout.invoiceTitle.y > 0 ? layout.invoiceTitle.y : flowY;
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleAlign = layout.invoiceTitle.align || 'center';
    doc.text('QUOTE', getXPosition(layout.invoiceTitle.x, titleAlign), titleY, {
      align: titleAlign as 'left' | 'center' | 'right',
    });
    flowY = Math.max(flowY, titleY + 10);
  }

  // Quote Details
  if (layout.invoiceDetails.visible) {
    const detailsY = layout.invoiceDetails.y > 0 ? layout.invoiceDetails.y : flowY;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // LEFT: Quote #, Date, Valid Until
    doc.text(`Quote #: ${quote.quoteNumber}`, layout.invoiceDetails.x, detailsY);
    let leftY = detailsY + 7;
    doc.text(`Date: ${formatDate(quote.createdAt)}`, layout.invoiceDetails.x, leftY);
    leftY += 7;
    if (quote.validUntil) {
      doc.text(`Valid Until: ${formatDate(quote.validUntil)}`, layout.invoiceDetails.x, leftY);
      leftY += 7;
    }

    // RIGHT: Terms
    doc.text(`Terms: ${quote.paymentTerms}`, pageWidth - 20, detailsY, { align: 'right' });

    flowY = Math.max(flowY, leftY + 2);
  }

  // Quote For (Bill To)
  if (layout.billTo.visible && quote.vendorName) {
    const billToY = layout.billTo.y > 0 ? layout.billTo.y : flowY;
    doc.setFont('helvetica', 'bold');
    doc.text('Quote For:', layout.billTo.x, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.vendorName, layout.billTo.x, billToY + 6);

    let vendorY = billToY + 12;
    if (quote.vendorAddress) {
      const addressLines = quote.vendorAddress.split('\n');
      addressLines.forEach((line) => {
        doc.text(line, layout.billTo.x, vendorY);
        vendorY += 5;
      });
    }
    flowY = Math.max(flowY, vendorY + 5);
  }

  // Items Table
  if (layout.itemsTable.visible) {
    const tableX = layout.itemsTable.x;
    const tableY = layout.itemsTable.y > 0 ? layout.itemsTable.y : flowY;
    let y = tableY;
    const hidePrices = quote.hidePrices;

    // Table Header (first page)
    doc.setFillColor(240, 240, 240);
    doc.rect(tableX, y - 4, pageWidth - tableX - 20, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Item', tableX + 2, y);
    doc.text('SKU', tableX + 72, y);
    doc.text('Qty', tableX + 105, y, { align: 'center' });
    if (!hidePrices) {
      doc.text('Price', tableX + 145, y, { align: 'right' });
      doc.text('Total', pageWidth - 22, y, { align: 'right' });
    }
    y += 10;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    let isFirstItem = true;
    quote.items.forEach((item) => {
      const nameLines = doc.splitTextToSize(item.itemName, 67);
      const skuLines = doc.splitTextToSize(item.sku, 30);
      const rowHeight = Math.max(nameLines.length, skuLines.length, 1) * LINE_HEIGHT;

      // Calculate total height this item needs (name/sku rows + optional note rows)
      let itemTotalHeight = rowHeight;
      let noteLines: string[] = [];
      if (item.notes) {
        noteLines = doc.splitTextToSize(`Note: ${item.notes}`, pageWidth - tableX - 24);
        itemTotalHeight += noteLines.length * NOTE_LINE_HEIGHT + 2;
      }

      // Page break BEFORE the item if it won't fit (skip for first item to guarantee at least one item on page 1)
      if (!isFirstItem && y + itemTotalHeight > safeBottom) {
        y = addPageWithHeader(true, tableX);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }
      isFirstItem = false;

      doc.text(nameLines, tableX + 2, y);
      doc.setTextColor(100, 100, 100);
      doc.text(skuLines, tableX + 72, y);
      doc.setTextColor(0, 0, 0);
      const qtyDisplay = item.quantity > 0 ? `${item.quantity} ${item.quantityUnit}` : '-';
      doc.text(qtyDisplay, tableX + 105, y, { align: 'center' });
      if (!hidePrices) {
        doc.text(formatCurrency(item.unitPrice), tableX + 145, y, { align: 'right' });
        doc.text(formatCurrency(item.totalPrice), pageWidth - 22, y, { align: 'right' });
      }
      y += rowHeight;

      if (item.notes && noteLines.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(noteLines, tableX + 4, y);
        y += noteLines.length * NOTE_LINE_HEIGHT + 2;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }

      // Draw separator line between items
      doc.setDrawColor(200, 200, 200);
      doc.line(tableX, y, pageWidth - 20, y);
      y += 4;
    });

    // Page break before totals if needed
    y += 2;
    if (y + 40 > safeBottom) {
      doc.addPage();
      y = 20;
    }

    flowY = y;
  }

  // Totals — estimate height needed
  if (!quote.hidePrices) {
    const totalsLineCount = 1 + (quote.discountAmount > 0 ? 1 : 0) + (quote.taxAmount > 0 ? 1 : 0) + 1;
    const totalsHeight = totalsLineCount * 7 + 10;
    if (flowY + totalsHeight > safeBottom) {
      doc.addPage();
      flowY = 20;
    }
  }

  if (layout.totals.visible && !quote.hidePrices) {
    const totalsY = layout.totals.y > 0 ? layout.totals.y : flowY;
    let y = totalsY;
    const totalsX = pageWidth - 70;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, y);
    doc.text(formatCurrency(quote.subtotal), pageWidth - 22, y, { align: 'right' });
    y += 7;

    if (quote.discountAmount > 0) {
      doc.setTextColor(34, 139, 34);
      doc.text(`Discount (${quote.discountRate}%):`, totalsX, y);
      doc.text(`-${formatCurrency(quote.discountAmount)}`, pageWidth - 22, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 7;
    }

    if (quote.taxAmount > 0) {
      doc.text(`Tax (${quote.taxRate}%):`, totalsX, y);
      doc.text(formatCurrency(quote.taxAmount), pageWidth - 22, y, { align: 'right' });
      y += 7;
    }

    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', totalsX, y);
    doc.text(formatCurrency(quote.total), pageWidth - 22, y, { align: 'right' });

    flowY = Math.max(flowY, y + 10);
  }

  // Notes — check if they fit
  if (layout.notes.visible && quote.notes) {
    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - layout.notes.x - 20);
    const notesHeight = splitNotes.length * LINE_HEIGHT + 12;
    if (flowY + notesHeight > safeBottom) {
      doc.addPage();
      flowY = 20;
    }

    const notesY = layout.notes.y > 0 ? layout.notes.y : flowY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', layout.notes.x, notesY);
    doc.setFont('helvetica', 'normal');
    doc.text(splitNotes, layout.notes.x, notesY + 6);
    flowY = Math.max(flowY, notesY + notesHeight);
  }

  // Footer — always on the last page at the bottom
  if (layout.footer.visible) {
    const thankYouNote = settings.thankYouNote || 'Thank you for considering our services!';
    const totalPages = (doc.internal as any).getNumberOfPages?.() ?? doc.getNumberOfPages();
    // Draw footer on every page
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const footerY = pageHeight - 10;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      const footerAlign = layout.footer.align || 'center';
      doc.text(thankYouNote, getXPosition(layout.footer.x, footerAlign), footerY, {
        align: footerAlign as 'left' | 'center' | 'right',
      });
    }
  }

  // Save the PDF
  doc.save(`${quote.quoteNumber}.pdf`);
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
