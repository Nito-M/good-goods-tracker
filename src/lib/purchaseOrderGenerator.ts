import jsPDF from 'jspdf';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { InvoiceSettings } from '@/types/sale';
import { format } from 'date-fns';

export async function generatePurchaseOrderPDF(order: PurchaseOrder, settings?: InvoiceSettings) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const formatDate = (date: Date) => {
    return format(date, 'MMMM d, yyyy');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const TAX_RATE = 0.05;
  const hasAnyCost = order.items.some(item => item.unitCost !== undefined && item.unitCost > 0);


  // Business Info (right side)
  if (settings?.businessName || settings?.businessAddress || settings?.businessPhone || settings?.businessEmail || settings?.businessNumber) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let businessY = 20;
    
    if (settings.businessName) {
      doc.setFont('helvetica', 'bold');
      doc.text(settings.businessName, pageWidth - 20, businessY, { align: 'right' });
      businessY += 5;
      doc.setFont('helvetica', 'normal');
    }
    if (settings.businessAddress) {
      const addressLines = settings.businessAddress.split('\n');
      addressLines.forEach((line) => {
        doc.text(line, pageWidth - 20, businessY, { align: 'right' });
        businessY += 5;
      });
    }
    if (settings.businessPhone) {
      doc.text(settings.businessPhone, pageWidth - 20, businessY, { align: 'right' });
      businessY += 5;
    }
    if (settings.businessEmail) {
      doc.text(settings.businessEmail, pageWidth - 20, businessY, { align: 'right' });
      businessY += 5;
    }
    if (settings.businessNumber) {
      doc.text(`Business #: ${settings.businessNumber}`, pageWidth - 20, businessY, { align: 'right' });
    }
    
    y = Math.max(y, businessY + 10);
  }

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE ORDER', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // PO Info
  const poNumber = order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`PO Number: ${poNumber}`, 20, y);
  doc.text(`Order Date: ${formatDate(order.orderedAt)}`, pageWidth - 20, y, {
    align: 'right',
  });
  y += 7;
  doc.text(`Status: ${order.status.toUpperCase()}`, 20, y);
  if (order.receivedAt) {
    doc.text(`Received: ${formatDate(order.receivedAt)}`, pageWidth - 20, y, {
      align: 'right',
    });
  }
  y += 15;

  // Vendor Info
  if (order.vendorName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Vendor:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(order.vendorName, 20, y);
    y += 10;
  }

  // Items Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 22, y);
  doc.text('SKU', 80, y);
  doc.text('Qty', 115, y);
  if (hasAnyCost) {
    doc.text('Unit Cost', 135, y);
    doc.text('Total', pageWidth - 22, y, { align: 'right' });
  }
  y += 10;

  // Items
  doc.setFont('helvetica', 'normal');
  order.items.forEach((item) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    
    const itemName =
      item.itemName.length > 30
        ? item.itemName.substring(0, 30) + '...'
        : item.itemName;
    doc.text(itemName, 22, y);
    doc.text(item.sku, 80, y);
    doc.text(item.quantity.toString(), 115, y);
    if (hasAnyCost) {
      const unitCost = item.unitCost || 0;
      doc.text(formatCurrency(unitCost), 135, y);
      doc.text(formatCurrency(unitCost * item.quantity), pageWidth - 22, y, { align: 'right' });
    }
    y += 7;
  });

  // Line
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Totals
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
  const taxAmount = subtotal * TAX_RATE;
  const totalCost = subtotal + taxAmount;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Items:', pageWidth - 70, y);
  doc.text(totalQuantity.toString(), pageWidth - 22, y, { align: 'right' });
  
  if (hasAnyCost) {
    y += 7;
    doc.text('Subtotal:', pageWidth - 70, y);
    doc.text(formatCurrency(subtotal), pageWidth - 22, y, { align: 'right' });
    y += 7;
    doc.text('Tax (5%):', pageWidth - 70, y);
    doc.text(formatCurrency(taxAmount), pageWidth - 22, y, { align: 'right' });
    y += 7;
    doc.setFontSize(11);
    doc.text('Total:', pageWidth - 70, y);
    doc.text(formatCurrency(totalCost), pageWidth - 22, y, { align: 'right' });
  }

  // Notes
  if (order.notes) {
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    
    const splitNotes = doc.splitTextToSize(order.notes, pageWidth - 40);
    doc.text(splitNotes, 20, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated by Inventory Management System', pageWidth / 2, footerY, {
    align: 'center',
  });

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
