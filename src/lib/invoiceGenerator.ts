import jsPDF from 'jspdf';
import { Sale, InvoiceSettings } from '@/types/sale';

export async function generateInvoicePDF(sale: Sale, settings?: InvoiceSettings) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Add logo if available (top left, 160x160 max)
  if (settings?.logoUrl) {
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
      
      doc.addImage(img, 'PNG', 20, y, imgWidth, imgHeight);
      y = 20 + imgHeight + 5;
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
  }

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
  doc.text('INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Invoice Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Number: ${sale.invoiceNumber}`, 20, y);
  doc.text(`Date: ${formatDate(sale.createdAt)}`, pageWidth - 20, y, {
    align: 'right',
  });
  y += 7;
  doc.text(`Status: ${sale.status.toUpperCase()}`, 20, y);
  doc.text(`Payment Terms: ${sale.paymentTerms}`, pageWidth - 20, y, {
    align: 'right',
  });
  y += 15;

  // Customer Info
  if (sale.vendorName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(sale.vendorName, 20, y);
    y += 6;
    
    // Add vendor address if available
    if (sale.vendorAddress) {
      const addressLines = sale.vendorAddress.split('\n');
      addressLines.forEach((line) => {
        doc.text(line, 20, y);
        y += 5;
      });
    }
    y += 10;
  }

  // Items Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 22, y);
  doc.text('SKU', 80, y);
  doc.text('Qty', 115, y);
  doc.text('Unit Price', 135, y);
  doc.text('Total', pageWidth - 22, y, { align: 'right' });
  y += 10;

  // Items
  doc.setFont('helvetica', 'normal');
  sale.items.forEach((item) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    
    const itemName =
      item.itemName.length > 25
        ? item.itemName.substring(0, 25) + '...'
        : item.itemName;
    doc.text(itemName, 22, y);
    doc.text(item.sku, 80, y);
    doc.text(item.quantity.toString(), 115, y);
    doc.text(formatCurrency(item.unitPrice), 135, y);
    doc.text(formatCurrency(item.totalPrice), pageWidth - 22, y, {
      align: 'right',
    });
    y += 7;
  });

  // Line
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Totals
  const totalsX = pageWidth - 70;
  
  doc.text('Subtotal:', totalsX, y);
  doc.text(formatCurrency(sale.subtotal), pageWidth - 22, y, { align: 'right' });
  y += 7;

  if (sale.discountAmount > 0) {
    doc.setTextColor(34, 139, 34);
    doc.text(`Discount (${sale.discountRate}%):`, totalsX, y);
    doc.text(`-${formatCurrency(sale.discountAmount)}`, pageWidth - 22, y, {
      align: 'right',
    });
    doc.setTextColor(0, 0, 0);
    y += 7;
  }

  if (sale.taxAmount > 0) {
    doc.text(`Tax (${sale.taxRate}%):`, totalsX, y);
    doc.text(formatCurrency(sale.taxAmount), pageWidth - 22, y, {
      align: 'right',
    });
    y += 7;
  }

  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', totalsX, y);
  doc.text(formatCurrency(sale.total), pageWidth - 22, y, { align: 'right' });

  // Notes
  if (sale.notes) {
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    
    const splitNotes = doc.splitTextToSize(sale.notes, pageWidth - 40);
    doc.text(splitNotes, 20, y);
  }

  // Footer with thank you note
  const thankYouNote = settings?.thankYouNote || 'Thank you for your business!';
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(thankYouNote, pageWidth / 2, footerY, {
    align: 'center',
  });

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
