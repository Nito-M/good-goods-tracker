import jsPDF from 'jspdf';
import { Sale, InvoiceSettings } from '@/types/sale';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import { formatCurrencyPdf as formatCurrency } from '@/lib/utils';
import { savePdfBlob } from '@/lib/pdfSave';

export async function generateInvoicePDF(sale: Sale, settings?: InvoiceSettings) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Get layout or use defaults
  const layout: InvoiceLayout = { ...defaultInvoiceLayout, ...(settings?.layout || {}) };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper to get X position based on alignment
  const getXPosition = (elementX: number, align?: string) => {
    if (align === 'right') return pageWidth - 20;
    if (align === 'center') return pageWidth / 2;
    return elementX;
  };

  // Track the current Y position for flowing content
  let flowY = 20;
  let logoHeight = 0;
  let businessInfoHeight = 0;

  // Add logo if available and visible
  if (settings?.logoUrl && layout.logo.visible) {
    try {
      const img = await loadImage(settings.logoUrl);
      const maxSize = 160 * 0.352778; // Convert 160px to mm (approx 56mm)
      let imgWidth = maxSize;
      let imgHeight = maxSize;
      
      // Maintain aspect ratio
      const aspectRatio = img.width / img.height;
      if (aspectRatio > 1) {
        imgHeight = imgWidth / aspectRatio;
      } else {
        imgWidth = imgHeight * aspectRatio;
      }
      
      doc.addImage(img, 'PNG', layout.logo.x, layout.logo.y, imgWidth, imgHeight);
      logoHeight = imgHeight;
      flowY = Math.max(flowY, layout.logo.y + imgHeight + 5);
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
  }

  // Business Info
  if (layout.businessInfo.visible && (settings?.businessName || settings?.businessAddress || settings?.businessPhone || settings?.businessEmail || settings?.businessNumber)) {
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
    if (settings.businessNumber) {
      doc.text(`Business #: ${settings.businessNumber}`, xPos, businessY, { align: align as 'left' | 'center' | 'right' });
      businessY += 5;
    }
    
    businessInfoHeight = businessY - layout.businessInfo.y;
    flowY = Math.max(flowY, businessY + 5);
  }

  // Invoice Title
  if (layout.invoiceTitle.visible) {
    const titleY = layout.invoiceTitle.y > 0 ? layout.invoiceTitle.y : flowY;
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleAlign = layout.invoiceTitle.align || 'center';
    doc.text('INVOICE', getXPosition(layout.invoiceTitle.x, titleAlign), titleY, { 
      align: titleAlign as 'left' | 'center' | 'right' 
    });
    flowY = Math.max(flowY, titleY + 15);
  }

  // Invoice Details
  if (layout.invoiceDetails.visible) {
    const detailsY = layout.invoiceDetails.y > 0 ? layout.invoiceDetails.y : flowY;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Number: ${sale.invoiceNumber}`, layout.invoiceDetails.x, detailsY);
    doc.text(`Date: ${formatDate(sale.createdAt)}`, pageWidth - 20, detailsY, { align: 'right' });
    doc.text(`Payment Terms: ${sale.paymentTerms}`, layout.invoiceDetails.x, detailsY + 7);
    let detailExtra = 0;
    if (sale.dueDate) {
      doc.text(`Due Date: ${formatDate(sale.dueDate)}`, pageWidth - 20, detailsY + 7, { align: 'right' });
    }
    flowY = Math.max(flowY, detailsY + 20 + detailExtra);
  }

  // Bill To
  if (layout.billTo.visible && sale.vendorName) {
    const billToY = layout.billTo.y > 0 ? layout.billTo.y : flowY;
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', layout.billTo.x, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.vendorName, layout.billTo.x, billToY + 6);
    
    let vendorY = billToY + 12;
    if ((sale as any).contactPersonName) {
      doc.text(`Attn: ${(sale as any).contactPersonName}`, layout.billTo.x, vendorY);
      vendorY += 6;
    }
    if (sale.vendorAddress) {
      const addressLines = sale.vendorAddress.split('\n');
      addressLines.forEach((line) => {
        doc.text(line, layout.billTo.x, vendorY);
        vendorY += 5;
      });
    }
    flowY = Math.max(flowY, vendorY + 10);
  }

  // Items Table
  if (layout.itemsTable.visible) {
    const tableY = layout.itemsTable.y > 0 ? layout.itemsTable.y : flowY;
    let y = tableY;

    const hasDiscount = sale.items.some((it) => (it.discountRate || 0) > 0);
    const showSku = sale.showSku !== false;

    // Column X positions (shift left when SKU is hidden)
    const skuX = layout.itemsTable.x + 60;
    const qtyX = showSku ? layout.itemsTable.x + 92 : layout.itemsTable.x + 95;
    const priceX = showSku ? layout.itemsTable.x + 108 : layout.itemsTable.x + 112;
    const discX = showSku ? layout.itemsTable.x + 135 : layout.itemsTable.x + 138;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(layout.itemsTable.x, y - 4, pageWidth - layout.itemsTable.x - 20, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item', layout.itemsTable.x + 2, y);
    if (showSku) {
      doc.text('SKU', skuX, y);
    }
    doc.text('Qty', qtyX, y);
    doc.text('Unit Price', priceX, y);
    if (hasDiscount) {
      doc.text('Disc %', discX, y);
    }
    doc.text('Total', pageWidth - 22, y, { align: 'right' });
    y += 10;

    // Items
    doc.setFont('helvetica', 'normal');
    const nameColWidth = showSku ? 55 : 88;
    const skuColWidth = 30;
    const PAGE_BOTTOM = 260;
    const PAGE_TOP = 20;
    sale.items.forEach((item) => {
      const nameLines = doc.splitTextToSize(item.itemName, nameColWidth);
      const skuLines = showSku ? doc.splitTextToSize(item.sku, skuColWidth) : [];
      const noteText = (item.notes || '').trim();
      const noteLines = noteText ? doc.splitTextToSize(`Note: ${noteText}`, nameColWidth) : [];

      // Only break before the row if there isn't room for at least the row's
      // first few lines — tall rows flow across pages instead of being pushed.
      const minChunk = Math.max(skuLines.length || 1, Math.min(nameLines.length, 3)) * 5;
      if (y + minChunk > PAGE_BOTTOM) {
        doc.addPage();
        y = PAGE_TOP;
      }

      const rate = item.discountRate || 0;
      const gross = item.quantity * item.unitPrice;
      const lineTotal = gross - gross * (rate / 100);

      // Right-hand columns render on the row's starting page
      if (showSku) {
        doc.text(skuLines, skuX, y);
      }
      doc.text(item.quantity.toString(), qtyX, y);
      doc.text(formatCurrency(item.unitPrice), priceX, y);
      if (hasDiscount) {
        doc.text(rate > 0 ? `${rate}%` : '-', discX, y);
      }
      doc.text(formatCurrency(lineTotal), pageWidth - 22, y, { align: 'right' });

      // Flow the name (and note) lines, paginating as needed
      const flowLines = (lines: string[], lineHeight: number) => {
        lines.forEach((line: string) => {
          if (y + lineHeight > PAGE_BOTTOM) {
            doc.addPage();
            y = PAGE_TOP;
          }
          doc.text(line, layout.itemsTable.x + 2, y);
          y += lineHeight;
        });
      };

      flowLines(nameLines, 5);
      if (skuLines.length > nameLines.length) {
        y += (skuLines.length - nameLines.length) * 5;
      }

      if (noteLines.length) {
        y += 1;
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        doc.setFont('helvetica', 'italic');
        flowLines(noteLines, 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      }

      y += 2;
    });


    // Line
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(layout.itemsTable.x, y, pageWidth - 20, y);
    y += 10;
    
    flowY = y;
  }

  // Helper: make sure `y` fits on the page, otherwise start a new page
  const ensureSpace = (y: number, needed: number) => {
    if (y + needed > pageHeight - 25) {
      doc.addPage();
      return 20;
    }
    return y;
  };

  // Totals
  const totalsX = pageWidth - 70;
  let totalsStartY: number | null = null;
  if (layout.totals.visible) {
    // Never place totals above the flowing content (long item lists push it down)
    const totalsY = Math.max(layout.totals.y > 0 ? layout.totals.y : 0, flowY);
    let y = ensureSpace(totalsY, 60);
    totalsStartY = y;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, y);
    doc.text(formatCurrency(sale.subtotal), pageWidth - 22, y, { align: 'right' });
    y += 7;

    if (sale.discountAmount > 0) {
      doc.setTextColor(34, 139, 34);
      doc.text(`Discount (${sale.discountRate}%):`, totalsX, y);
      doc.text(`-${formatCurrency(sale.discountAmount)}`, pageWidth - 22, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 7;
    }

    const itemDiscountTotal = sale.items.reduce(
      (sum, it) => sum + (it.quantity * it.unitPrice * ((it.discountRate || 0) / 100)),
      0,
    );
    if (itemDiscountTotal > 0) {
      doc.setTextColor(34, 139, 34);
      doc.text('Item Discounts:', totalsX, y);
      doc.text(`-${formatCurrency(itemDiscountTotal)}`, pageWidth - 22, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 7;
    }

    if (sale.taxAmount > 0) {
      doc.text(`Tax (${sale.taxRate}%):`, totalsX, y);
      doc.text(formatCurrency(sale.taxAmount), pageWidth - 22, y, { align: 'right' });
      y += 7;
    }

    for (const [idx, adj] of (sale.adjustments || []).entries()) {
      const label = (adj.label || '').trim() || `Adjustment ${idx + 1}`;
      const isNegative = adj.amount < 0;
      if (isNegative) doc.setTextColor(34, 139, 34);
      doc.text(`${label}:`, totalsX, y);
      const value = `${isNegative ? '-' : ''}${formatCurrency(Math.abs(adj.amount))}`;
      doc.text(value, pageWidth - 22, y, { align: 'right' });
      if (isNegative) doc.setTextColor(0, 0, 0);
      y += 7;
    }

    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', totalsX, y);
    doc.text(formatCurrency(sale.total), pageWidth - 22, y, { align: 'right' });
    
    flowY = Math.max(flowY, y + 10);
  }

  // Notes — placed to the left of the totals block so they share the same space
  if (layout.notes.visible && sale.notes && sale.notes.trim()) {
    doc.setFontSize(10);
    const notesX = layout.notes.x;
    const sideBySide = totalsStartY !== null && notesX < totalsX - 30;
    const notesWidth = sideBySide
      ? totalsX - notesX - 8
      : pageWidth - notesX - 20;
    const splitNotes = doc.splitTextToSize(sale.notes, notesWidth);

    const desiredY = sideBySide
      ? (totalsStartY as number)
      : Math.max(layout.notes.y > 0 ? layout.notes.y : 0, flowY + 10);
    const notesY = ensureSpace(desiredY, splitNotes.length * 5 + 12);

    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', notesX, notesY);
    doc.setFont('helvetica', 'normal');
    doc.text(splitNotes, notesX, notesY + 6);
    flowY = Math.max(flowY, notesY + 6 + splitNotes.length * 5);
  }


  // Footer
  if (layout.footer.visible) {
    const thankYouNote = settings?.thankYouNote || 'Thank you for your business!';
    const footerY = layout.footer.y > 0 ? layout.footer.y : pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    const footerAlign = layout.footer.align || 'center';
    doc.text(thankYouNote, getXPosition(layout.footer.x, footerAlign), footerY, {
      align: footerAlign as 'left' | 'center' | 'right',
    });
  }

  // Save the PDF
  await savePdfBlob(doc, `${sale.invoiceNumber}.pdf`);
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
