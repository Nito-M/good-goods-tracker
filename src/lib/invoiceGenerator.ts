import jsPDF from 'jspdf';
import { Sale, InvoiceSettings } from '@/types/sale';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import { formatCurrency } from '@/lib/utils';

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
    flowY = Math.max(flowY, detailsY + 20);
  }

  // Bill To
  if (layout.billTo.visible && sale.vendorName) {
    const billToY = layout.billTo.y > 0 ? layout.billTo.y : flowY;
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', layout.billTo.x, billToY);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.vendorName, layout.billTo.x, billToY + 6);
    
    let vendorY = billToY + 12;
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
    
    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(layout.itemsTable.x, y - 4, pageWidth - layout.itemsTable.x - 20, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item', layout.itemsTable.x + 2, y);
    doc.text('SKU', layout.itemsTable.x + 60, y);
    doc.text('Qty', layout.itemsTable.x + 95, y);
    doc.text('Unit Price', layout.itemsTable.x + 115, y);
    doc.text('Total', pageWidth - 22, y, { align: 'right' });
    y += 10;

    // Items
    doc.setFont('helvetica', 'normal');
    const nameColWidth = 55;
    const skuColWidth = 32;
    sale.items.forEach((item) => {
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
      doc.text(formatCurrency(item.unitPrice), layout.itemsTable.x + 115, y);
      doc.text(formatCurrency(item.totalPrice), pageWidth - 22, y, { align: 'right' });
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

    if (sale.taxAmount > 0) {
      doc.text(`Tax (${sale.taxRate}%):`, totalsX, y);
      doc.text(formatCurrency(sale.taxAmount), pageWidth - 22, y, { align: 'right' });
      y += 7;
    }

    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', totalsX, y);
    doc.text(formatCurrency(sale.total), pageWidth - 22, y, { align: 'right' });
    
    flowY = Math.max(flowY, y + 10);
  }

  // Notes
  if (layout.notes.visible && sale.notes) {
    const notesY = layout.notes.y > 0 ? layout.notes.y : flowY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', layout.notes.x, notesY);
    doc.setFont('helvetica', 'normal');
    
    const splitNotes = doc.splitTextToSize(sale.notes, pageWidth - layout.notes.x - 20);
    doc.text(splitNotes, layout.notes.x, notesY + 6);
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
  doc.save(`${sale.invoiceNumber}.pdf`);
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
