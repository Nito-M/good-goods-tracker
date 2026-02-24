import { useState, useMemo } from "react";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useSales } from "@/hooks/useSales";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageViewerDialog } from "@/components/ImageViewerDialog";
import { FileText, Image, Download, ExternalLink, Receipt, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaxDocument {
  id: string;
  type: "po-pdf" | "po-image" | "po-attachment" | "invoice";
  refNumber: string;
  vendorName: string | null;
  date: Date;
  fileType: "pdf" | "image";
  url?: string;
  storagePath?: string;
  fileName?: string;
  // For invoices: the sale object id to generate PDF
  saleId?: string;
}

export function TaxDocuments() {
  const { orders, loading: poLoading } = usePurchaseOrders();
  const { sales, loading: salesLoading } = useSales();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const loading = poLoading || salesLoading;

  // Build year options from data
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    orders.forEach(o => yearSet.add(new Date(o.orderedAt).getFullYear()));
    sales.forEach(s => yearSet.add(new Date(s.createdAt).getFullYear()));
    yearSet.add(new Date().getFullYear());
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [orders, sales]);

  // Build documents list
  const { poDocuments, invoiceDocuments } = useMemo(() => {
    const yearNum = parseInt(selectedYear);
    const poDocs: TaxDocument[] = [];
    const invDocs: TaxDocument[] = [];

    // PO documents
    for (const po of orders) {
      const poDate = new Date(po.orderedAt);
      if (poDate.getFullYear() !== yearNum) continue;
      const ref = po.poNumber || "PO-????";

      if (po.pdfUrl) {
        poDocs.push({
          id: `${po.id}-pdf`,
          type: "po-pdf",
          refNumber: ref,
          vendorName: po.vendorName || null,
          date: poDate,
          fileType: "pdf",
          url: po.pdfUrl,
          fileName: `${ref}.pdf`,
        });
      }
      if (po.imageUrl) {
        poDocs.push({
          id: `${po.id}-img`,
          type: "po-image",
          refNumber: ref,
          vendorName: po.vendorName || null,
          date: poDate,
          fileType: "image",
          url: po.imageUrl,
          fileName: `${ref}-receipt`,
        });
      }
      if (po.attachments) {
        for (const att of po.attachments) {
          poDocs.push({
            id: att.id,
            type: "po-attachment",
            refNumber: ref,
            vendorName: po.vendorName || null,
            date: new Date(att.createdAt),
            fileType: att.fileType,
            url: att.url,
            fileName: att.fileName || `${ref}-attachment`,
          });
        }
      }
    }

    // Invoice documents
    for (const sale of sales) {
      const saleDate = new Date(sale.createdAt);
      if (saleDate.getFullYear() !== yearNum) continue;

      invDocs.push({
        id: sale.id,
        type: "invoice",
        refNumber: sale.invoiceNumber || "INV-????",
        vendorName: sale.vendorName || null,
        date: saleDate,
        fileType: "pdf",
        saleId: sale.id,
      });
    }

    return { poDocuments: poDocs, invoiceDocuments: invDocs };
  }, [orders, sales, selectedYear]);

  const handleOpenFile = async (doc: TaxDocument) => {
    if (doc.type === "invoice") {
      // For invoices there's no stored file — user uses existing download flow on Sales page
      return;
    }

    if (!doc.url) return;

    if (doc.fileType === "image") {
      // Try to get a fresh signed URL if it's a storage path
      setViewerImage(doc.url);
      setViewerOpen(true);
    } else {
      window.open(doc.url, "_blank");
    }
  };

  const isImage = (ft: string) => ft === "image";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tax Documents</h1>
          <p className="text-sm text-muted-foreground">
            All uploaded receipts, PO files, and invoices in one place
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading documents...</div>
      ) : (
        <Tabs defaultValue="purchase-orders">
          <TabsList>
            <TabsTrigger value="purchase-orders">
              Purchase Orders ({poDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Invoices ({invoiceDocuments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase-orders" className="mt-4">
            {poDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No PO documents found for {selectedYear}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {poDocuments.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onOpen={handleOpenFile} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            {invoiceDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No invoices found for {selectedYear}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {invoiceDocuments.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onOpen={handleOpenFile} isInvoice />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <ImageViewerDialog
        imageUrl={viewerImage}
        alt="Document preview"
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}

function DocumentCard({
  doc,
  onOpen,
  isInvoice,
}: {
  doc: TaxDocument;
  onOpen: (doc: TaxDocument) => void;
  isInvoice?: boolean;
}) {
  const isPdf = doc.fileType === "pdf";
  const typeLabel = doc.type === "po-pdf"
    ? "PO PDF"
    : doc.type === "po-image"
    ? "Receipt"
    : doc.type === "po-attachment"
    ? "Attachment"
    : "Invoice";

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => !isInvoice && onOpen(doc)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isPdf ? (
              <FileText className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <Image className="h-5 w-5 text-primary shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{doc.refNumber}</p>
              {doc.vendorName && (
                <p className="text-xs text-muted-foreground truncate">{doc.vendorName}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">{typeLabel}</Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(doc.date, "MMM d, yyyy")}</span>
          {doc.fileName && (
            <span className="truncate max-w-[120px]">{doc.fileName}</span>
          )}
        </div>

        {isInvoice && (
          <p className="text-xs text-muted-foreground italic">
            Download from Sales page
          </p>
        )}
      </CardContent>
    </Card>
  );
}
