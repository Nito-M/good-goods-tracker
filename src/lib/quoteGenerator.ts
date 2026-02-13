import jsPDF from 'jspdf';
import { Quote, QuoteSettings } from '@/types/quote';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import { formatCurrency } from '@/lib/utils';

export const generateQuotePDF = async (quote: Quote, settings: QuoteSettings) => {
  const doc = new jsPDF();
  const layout: InvoiceLayout = settings.layout || defaultInvoiceLayout;
  
  // Load logo if available
  let logoLoaded = false;
  if (settings.logoUrl && layout.logo.visible) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            const maxWidth = 40;
            const maxHeight = 40;
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;
            doc.addImage(img, 'PNG', layout.logo.x, layout.logo.y, width, height);
            logoLoaded = true;
          } catch (e) {
            console.error('Error adding logo to PDF:', e);
          }
          resolve();
        };
        img.onerror = () => {
          console.error('Error loading logo image');
          resolve();
        };
        img.src = settings.logoUrl!;
      });
    } catch (e) {
      console.error('Error processing logo:', e);
    }
  }

  // Business info
  if (layout.businessInfo.visible) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    const businessLines = [
      settings.businessName,
      settings.businessAddress,
      settings.businessPhone,
      settings.businessEmail,
      settings.businessNumber ? `Business #: ${settings.businessNumber}` : null,
    ].filter(Boolean) as string[];
    
    const align = layout.businessInfo.align || 'right';
    businessLines.forEach((line, i) => {
      if (align === 'right') {
        doc.text(line, layout.businessInfo.x, layout.businessInfo.y + (i * 5), { align: 'right' });
      } else if (align === 'center') {
        doc.text(line, layout.businessInfo.x, layout.businessInfo.y + (i * 5), { align: 'center' });
      } else {
        doc.text(line, layout.businessInfo.x, layout.businessInfo.y + (i * 5));
      }
    });
  }

  // Quote title
  if (layout.invoiceTitle?.visible !== false) {
    const titleY = layout.invoiceTitle?.y || 60;
    const titleX = layout.invoiceTitle?.x || 105;
    const titleAlign = layout.invoiceTitle?.align || 'center';
    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.text('QUOTE', titleX, titleY, { align: titleAlign as 'center' | 'left' | 'right' });
  }

  // Quote details
  if (layout.invoiceDetails?.visible !== false) {
    const detailsY = layout.invoiceDetails?.y || 75;
    const detailsX = layout.invoiceDetails?.x || 20;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Quote #: ${quote.quoteNumber}`, detailsX, detailsY);
    doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, detailsX, detailsY + 5);
    if (quote.validUntil) {
      doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, detailsX, detailsY + 10);
    }
    doc.text(`Terms: ${quote.paymentTerms}`, detailsX, detailsY + (quote.validUntil ? 15 : 10));
  }

  // Bill To
  if (layout.billTo.visible) {
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Quote For:', layout.billTo.x, layout.billTo.y);
    doc.setTextColor(100);
    if (quote.vendorName) {
      doc.text(quote.vendorName, layout.billTo.x, layout.billTo.y + 6);
    }
    if (quote.vendorAddress) {
      const addressLines = quote.vendorAddress.split('\n');
      addressLines.forEach((line, i) => {
        doc.text(line, layout.billTo.x, layout.billTo.y + 12 + (i * 5));
      });
    }
  }

  // Items table
  if (layout.itemsTable.visible) {
    const tableY = layout.itemsTable.y;
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    // Table header
    doc.setFillColor(245, 245, 245);
    doc.rect(layout.itemsTable.x, tableY - 5, 170, 8, 'F');
    doc.text('Item', layout.itemsTable.x + 2, tableY);
    doc.text('SKU', layout.itemsTable.x + 70, tableY);
    doc.text('Qty', layout.itemsTable.x + 100, tableY);
    doc.text('Price', layout.itemsTable.x + 120, tableY);
    doc.text('Total', layout.itemsTable.x + 150, tableY);
    
    // Table rows
    let y = tableY + 8;
    quote.items.forEach((item) => {
      doc.setTextColor(0);
      doc.text(item.itemName.substring(0, 30), layout.itemsTable.x + 2, y);
      doc.setTextColor(100);
      doc.text(item.sku, layout.itemsTable.x + 70, y);
      const qtyDisplay = item.quantity > 0 ? `${item.quantity} ${item.quantityUnit}` : '-';
      doc.text(qtyDisplay, layout.itemsTable.x + 100, y);
      doc.text(formatCurrency(item.unitPrice), layout.itemsTable.x + 120, y);
      doc.text(formatCurrency(item.totalPrice), layout.itemsTable.x + 150, y);
      y += 7;
      
      // Add item notes if present
      if (item.notes) {
        doc.setFontSize(8);
        doc.setTextColor(120);
        const noteLines = doc.splitTextToSize(`Note: ${item.notes}`, 165);
        doc.text(noteLines, layout.itemsTable.x + 4, y);
        y += noteLines.length * 4 + 2;
        doc.setFontSize(10);
      }
    });
  }

  // Totals
  if (layout.totals.visible) {
    const totalsY = layout.totals.y === -1 
      ? layout.itemsTable.y + 8 + (quote.items.length * 7) + 15
      : layout.totals.y;
    const totalsX = layout.totals.x;
    const align = layout.totals.align || 'right';
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    const addTotalLine = (label: string, value: string, yOffset: number, isBold = false) => {
      if (isBold) {
        doc.setTextColor(0);
        doc.setFontSize(12);
      }
      if (align === 'right') {
        doc.text(`${label}: ${value}`, totalsX, totalsY + yOffset, { align: 'right' });
      } else {
        doc.text(`${label}: ${value}`, totalsX, totalsY + yOffset);
      }
      if (isBold) {
        doc.setTextColor(100);
        doc.setFontSize(10);
      }
    };
    
    let offset = 0;
    addTotalLine('Subtotal', formatCurrency(quote.subtotal), offset);
    offset += 6;
    
    if (quote.discountAmount > 0) {
      addTotalLine(`Discount (${quote.discountRate}%)`, `-${formatCurrency(quote.discountAmount)}`, offset);
      offset += 6;
    }
    
    if (quote.taxAmount > 0) {
      addTotalLine(`Tax (${quote.taxRate}%)`, formatCurrency(quote.taxAmount), offset);
      offset += 6;
    }
    
    addTotalLine('Total', formatCurrency(quote.total), offset + 2, true);
  }

  // Notes
  if (layout.notes.visible && quote.notes) {
    const notesY = layout.notes.y === -1 
      ? layout.itemsTable.y + 8 + (quote.items.length * 7) + 60
      : layout.notes.y;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('Notes:', layout.notes.x, notesY);
    doc.setTextColor(100);
    const noteLines = doc.splitTextToSize(quote.notes, 170);
    doc.text(noteLines, layout.notes.x, notesY + 6);
  }

  // Footer
  if (layout.footer.visible && settings.thankYouNote) {
    const footerY = layout.footer.y === -1 ? 280 : layout.footer.y;
    const footerAlign = layout.footer.align || 'center';
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(settings.thankYouNote, layout.footer.x, footerY, { align: footerAlign as 'center' | 'left' | 'right' });
  }

  // Save the PDF
  doc.save(`${quote.quoteNumber}.pdf`);
};
