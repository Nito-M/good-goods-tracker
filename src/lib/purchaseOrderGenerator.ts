import jsPDF from 'jspdf';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { InvoiceSettings } from '@/types/sale';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

export async function generatePurchaseOrderPDF(order: PurchaseOrder, settings?: InvoiceSettings) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const layout: InvoiceLayout = { ...defaultInvoiceLayout, ...(settings?.layout || {}) };

  const TAX_RATE = 0.05;
  const hasAnyCost = order.items.some(item => item.unitCost !== undefined && item.unitCost > 0);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMMM d, yyyy');
  };

  const getXPosition = (elementX: number, align?: string) => {
    if (align === 'right') return pageWidth - 20;
    if (align === 'center') return pageWidth / 2;
    return elementX;
  };

  let flowY = 20;

  // Add logo if available and visible
  if (settings?.logoUrl && layout.logo.visible) {
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

      doc.addImage(img, 'PNG', layout.logo.x, layout.logo.y, imgWidth, imgHeight);
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

    flowY = Math.max(flowY, businessY + 5);
  }

  // Title
  if (layout.invoiceTitle.visible) {
    const titleY = layout.invoiceTitle.y > 0 ? layout.invoiceTitle.y : flowY;
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleAlign = layout.invoiceTitle.align || 'center';
    doc.text('PURCHASE ORDER', getXPosition(layout.invoiceTitle.x, titleAlign), titleY, {
      align: titleAlign as 'left' | 'center' | 'right',
    });
    flowY = Math.max(flowY, titleY + 15);
  }

  // PO Details
  if (layout.invoiceDetails.visible) {
    const detailsY = layout.invoiceDetails.y > 0 ? layout.invoiceDetails.y : flowY;
    const poNumber = order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`PO Number: ${poNumber}`, layout.invoiceDetails.x, detailsY);
    doc.text(`Order Date: ${formatDate(order.orderedAt)}`, pageWidth - 20, detailsY, { align: 'right' });
    if (order.receivedAt) {
      doc.text(`Received: ${formatDate(order.receivedAt)}`, layout.invoiceDetails.x, detailsY + 7);
    }
    flowY = Math.max(flowY, detailsY + 20);
  }

  // Vendor (Bill To)
  if (layout.billTo.visible && order.vendorName) {
    const billToY = layout.billTo.y > 0 ? layout.billTo.y : flowY;
    doc.setFont('helvetica', 'bold');
    doc.text('Vendor:', layout.billTo.x, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.vendorName, layout.billTo.x, billToY + 6);
    flowY = Math.max(flowY, billToY + 16);
  }

  // Items Table
  if (layout.itemsTable.visible) {
    const tableY = layout.itemsTable.y > 0 ? layout.itemsTable.y : flowY;
    let y = tableY;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(layout.itemsTable.x, y - 4, pageWidth - layout.itemsTable.x - 20, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item', layout.itemsTable.x + 2, y);
    doc.text('SKU', layout.itemsTable.x + 60, y);
    doc.text('Qty', layout.itemsTable.x + 95, y);
    if (hasAnyCost) {
      doc.text('Unit Cost', layout.itemsTable.x + 115, y);
      doc.text('Total', pageWidth - 22, y, { align: 'right' });
    }
    y += 10;

    // Items
    doc.setFont('helvetica', 'normal');
    const nameColWidth = 55;
    const skuColWidth = 32;
    order.items.forEach((item) => {
      const nameLines = doc.splitTextToSize(item.itemName, nameColWidth);
      const skuLines = doc.splitTextToSize(item.sku, skuColWidth);
      const rowLineCount = Math.max(nameLines.length, skuLines.length);
      const rowHeight = rowLineCount * 5;

      if (y + rowHeight > 260) {
        doc.addPage();
        y = 20;
      }

      doc.text(nameLines, layout.itemsTable.x + 2, y);
      doc.text(skuLines, layout.itemsTable.x + 60, y);
      doc.text(item.quantity.toString(), layout.itemsTable.x + 95, y);
      if (hasAnyCost) {
        const unitCost = item.unitCost || 0;
        doc.text(formatCurrency(unitCost), layout.itemsTable.x + 115, y);
        doc.text(formatCurrency(unitCost * item.quantity), pageWidth - 22, y, { align: 'right' });
      }
      y += rowHeight + 2;
    });

    // Line
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(layout.itemsTable.x, y, pageWidth - 20, y);
    y += 10;

    flowY = y;
  }

  // Totals
  if (layout.totals.visible) {
    const totalsY = layout.totals.y > 0 ? layout.totals.y : flowY;
    let y = totalsY;
    const totalsX = pageWidth - 70;
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
    const discountAmount = order.discountAmount || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = afterDiscount * TAX_RATE;
    const totalCost = afterDiscount + taxAmount;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Items:', totalsX, y);
    doc.text(totalQuantity.toString(), pageWidth - 22, y, { align: 'right' });

    if (hasAnyCost) {
      y += 7;
      doc.text('Subtotal:', totalsX, y);
      doc.text(formatCurrency(subtotal), pageWidth - 22, y, { align: 'right' });

      if (discountAmount > 0) {
        y += 7;
        doc.setTextColor(34, 139, 34);
        doc.text(`Discount${order.discountType === 'percentage' && order.discountValue > 0 ? ` (${order.discountValue}%)` : ''}:`, totalsX, y);
        doc.text(`-${formatCurrency(discountAmount)}`, pageWidth - 22, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }

      y += 7;
      doc.text('Tax (5%):', totalsX, y);
      doc.text(formatCurrency(taxAmount), pageWidth - 22, y, { align: 'right' });

      y += 3;
      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL:', totalsX, y);
      doc.text(formatCurrency(totalCost), pageWidth - 22, y, { align: 'right' });
    }

    flowY = Math.max(flowY, y + 10);
  }

  // Notes
  if (layout.notes.visible && order.notes) {
    const notesY = layout.notes.y > 0 ? layout.notes.y : flowY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', layout.notes.x, notesY);
    doc.setFont('helvetica', 'normal');

    const splitNotes = doc.splitTextToSize(order.notes, pageWidth - layout.notes.x - 20);
    doc.text(splitNotes, layout.notes.x, notesY + 6);
  }

  // Footer
  if (layout.footer.visible) {
    const footerText = 'Generated by Inventory Management System';
    const footerY = layout.footer.y > 0 ? layout.footer.y : pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    const footerAlign = layout.footer.align || 'center';
    doc.text(footerText, getXPosition(layout.footer.x, footerAlign), footerY, {
      align: footerAlign as 'left' | 'center' | 'right',
    });
  }

  // Save the PDF
  const fileName = order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`;
  doc.save(`${fileName}.pdf`);
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
