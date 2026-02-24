import { useState, useMemo, useRef, useCallback } from "react";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useSales } from "@/hooks/useSales";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageViewerDialog } from "@/components/ImageViewerDialog";
import { FileText, Image, Upload, Plus, X, Loader2, ShoppingCart, Receipt, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TaxDocument {
  id: string;
  type: "po-pdf" | "po-image" | "po-attachment" | "invoice" | "uploaded";
  refNumber: string;
  vendorName: string | null;
  date: Date;
  fileType: "pdf" | "image";
  url?: string;
  storagePath?: string;
  fileName?: string;
  saleId?: string;
  // Extracted fields
  extractedVendor?: string | null;
  extractedDate?: string | null;
  extractedTotal?: number | null;
  extractedGst?: number | null;
  extractionStatus?: string | null;
}

export function TaxDocuments() {
  const { orders, loading: poLoading } = usePurchaseOrders();
  const { sales, loading: salesLoading } = useSales();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<TaxDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDroppingFiles, setIsDroppingFiles] = useState(false);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [extractingIds, setExtractingIds] = useState<Set<string>>(new Set());
  const [poExtractedData, setPoExtractedData] = useState<Record<string, { vendor?: string | null; date?: string | null; total?: number | null; gst?: number | null }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loading = poLoading || salesLoading;

  // Fetch user-uploaded tax documents
  const fetchUploadedDocs = useCallback(async () => {
    if (!user) return;
    setLoadingUploads(true);
    const { data, error } = await supabase
      .from("tax_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tax docs:", error);
    } else if (data) {
      const docs: TaxDocument[] = [];
      for (const row of data) {
        const { data: signedData } = await supabase.storage
          .from("tax-documents")
          .createSignedUrl(row.file_url, 3600);
        docs.push({
          id: row.id,
          type: "uploaded",
          refNumber: row.file_name || "Uploaded",
          vendorName: null,
          date: new Date(row.created_at),
          fileType: row.file_type === "pdf" ? "pdf" : "image",
          url: signedData?.signedUrl || "",
          fileName: row.file_name || undefined,
          storagePath: row.file_url,
          extractedVendor: (row as any).extracted_vendor,
          extractedDate: (row as any).extracted_date,
          extractedTotal: (row as any).extracted_total,
          extractedGst: (row as any).extracted_gst,
          extractionStatus: (row as any).extraction_status,
        });
      }
      setUploadedDocs(docs);
    }
    setLoadingUploads(false);
  }, [user]);

  // Fetch on mount
  useState(() => {
    fetchUploadedDocs();
  });

  // Extract document data using AI
  const extractDocument = async (docId: string, signedUrl?: string, fileName?: string) => {
    setExtractingIds(prev => new Set(prev).add(docId));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please sign in", variant: "destructive" });
        return;
      }

      const bodyPayload: any = signedUrl
        ? { signedUrl, fileName }
        : { documentId: docId };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-tax-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(bodyPayload),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Extraction failed" }));
        toast({ title: "Extraction failed", description: err.error, variant: "destructive" });
        return;
      }

      const result = await response.json();
      toast({ title: "Data extracted successfully" });

      if (signedUrl && result.extracted) {
        // PO doc - store results in local state
        setPoExtractedData(prev => ({
          ...prev,
          [docId]: {
            vendor: result.extracted.extracted_vendor,
            date: result.extracted.extracted_date,
            total: result.extracted.extracted_total,
            gst: result.extracted.extracted_gst,
          },
        }));
      } else {
        await fetchUploadedDocs();
      }
    } catch (e) {
      toast({ title: "Extraction error", variant: "destructive" });
    } finally {
      setExtractingIds(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  };

  // Upload files
  const uploadFiles = async (files: File[]) => {
    if (!user || files.length === 0) return;
    setUploading(true);
    const newDocIds: string[] = [];
    try {
      for (const file of files) {
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";
        if (!isImage && !isPdf) {
          toast({ title: "Unsupported file", description: `${file.name} is not an image or PDF`, variant: "destructive" });
          continue;
        }

        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("tax-documents")
          .upload(path, file);

        if (uploadError) {
          toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
          continue;
        }

        const { data: insertData, error: dbError } = await supabase.from("tax_documents").insert({
          user_id: user.id,
          file_url: path,
          file_name: file.name,
          file_type: isPdf ? "pdf" : "image",
          year: parseInt(selectedYear),
        }).select("id").single();

        if (dbError) {
          toast({ title: "Save failed", description: dbError.message, variant: "destructive" });
        } else if (insertData) {
          newDocIds.push(insertData.id);
        }
      }
      toast({ title: "Upload complete" });
      await fetchUploadedDocs();

      // Auto-extract all newly uploaded docs
      for (const docId of newDocIds) {
        extractDocument(docId);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    uploadFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDroppingFiles(false);
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    if (files.length) uploadFiles(files);
  };

  const handleDeleteUploaded = async (doc: TaxDocument) => {
    if (!doc.storagePath) return;
    await supabase.storage.from("tax-documents").remove([doc.storagePath]);
    await supabase.from("tax_documents").delete().eq("id", doc.id);
    setUploadedDocs(prev => prev.filter(d => d.id !== doc.id));
    toast({ title: "Document deleted" });
  };

  // Build year options from data
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    orders.forEach(o => yearSet.add(new Date(o.orderedAt).getFullYear()));
    sales.forEach(s => yearSet.add(new Date(s.createdAt).getFullYear()));
    uploadedDocs.forEach(d => yearSet.add(d.date.getFullYear()));
    yearSet.add(new Date().getFullYear());
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [orders, sales, uploadedDocs]);

  // Build documents list
  const { poDocuments, invoiceDocuments } = useMemo(() => {
    const yearNum = parseInt(selectedYear);
    const poDocs: TaxDocument[] = [];
    const invDocs: TaxDocument[] = [];

    for (const po of orders) {
      const poDate = new Date(po.orderedAt);
      if (poDate.getFullYear() !== yearNum) continue;
      const ref = po.poNumber || "PO-????";

      if (po.pdfUrl) {
        poDocs.push({ id: `${po.id}-pdf`, type: "po-pdf", refNumber: ref, vendorName: po.vendorName || null, date: poDate, fileType: "pdf", url: po.pdfUrl, fileName: `${ref}.pdf` });
      }
      if (po.imageUrl) {
        poDocs.push({ id: `${po.id}-img`, type: "po-image", refNumber: ref, vendorName: po.vendorName || null, date: poDate, fileType: "image", url: po.imageUrl, fileName: `${ref}-receipt` });
      }
      if (po.attachments) {
        for (const att of po.attachments) {
          poDocs.push({ id: att.id, type: "po-attachment", refNumber: ref, vendorName: po.vendorName || null, date: new Date(att.createdAt), fileType: att.fileType, url: att.url, fileName: att.fileName || `${ref}-attachment` });
        }
      }
    }

    for (const sale of sales) {
      const saleDate = new Date(sale.createdAt);
      if (saleDate.getFullYear() !== yearNum) continue;
      invDocs.push({ id: sale.id, type: "invoice", refNumber: sale.invoiceNumber || "INV-????", vendorName: sale.vendorName || null, date: saleDate, fileType: "pdf", saleId: sale.id });
    }

    return { poDocuments: poDocs, invoiceDocuments: invDocs };
  }, [orders, sales, selectedYear]);

  const filteredUploads = useMemo(() => {
    const yearNum = parseInt(selectedYear);
    return uploadedDocs.filter(d => d.date.getFullYear() === yearNum);
  }, [uploadedDocs, selectedYear]);

  const handleOpenFile = async (doc: TaxDocument) => {
    if (doc.type === "invoice") return;
    if (!doc.url) return;

    if (doc.fileType === "image") {
      setViewerImage(doc.url);
      setViewerOpen(true);
    } else {
      window.open(doc.url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tax Documents</h1>
          <p className="text-sm text-muted-foreground">
            All uploaded receipts, PO files, and invoices in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDroppingFiles ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
        )}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDroppingFiles(true); }}
        onDragLeave={() => setIsDroppingFiles(false)}
        onDrop={handleDropZoneDrop}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Plus className={cn("h-8 w-8", isDroppingFiles && "text-primary")} />
            <p className="text-sm">
              Drag & drop images or PDFs here, or click to browse
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading documents...</div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              All Costs ({filteredUploads.length + poDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="uploads">
              Uploads ({filteredUploads.length})
            </TabsTrigger>
            <TabsTrigger value="purchase-orders">
              Purchase Orders ({poDocuments.length})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Invoices ({invoiceDocuments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {filteredUploads.length + poDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No documents for {selectedYear}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredUploads.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onOpen={handleOpenFile}
                    onDelete={handleDeleteUploaded}
                    onExtract={extractDocument}
                    isExtracting={extractingIds.has(doc.id)}
                  />
                ))}
                {poDocuments.map(doc => (
                  <DocumentCard key={doc.id} doc={{
                    ...doc,
                    ...(poExtractedData[doc.id] ? {
                      extractedVendor: poExtractedData[doc.id].vendor,
                      extractedDate: poExtractedData[doc.id].date,
                      extractedTotal: poExtractedData[doc.id].total,
                      extractedGst: poExtractedData[doc.id].gst,
                      extractionStatus: "done",
                    } : {}),
                  }} onOpen={handleOpenFile} onExtract={(id) => extractDocument(id, doc.url, doc.fileName)} isExtracting={extractingIds.has(doc.id)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="uploads" className="mt-4">
            {filteredUploads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No uploaded documents for {selectedYear}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredUploads.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onOpen={handleOpenFile}
                    onDelete={handleDeleteUploaded}
                    onExtract={extractDocument}
                    isExtracting={extractingIds.has(doc.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchase-orders" className="mt-4">
            {poDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No PO documents found for {selectedYear}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {poDocuments.map(doc => (
                  <DocumentCard key={doc.id} doc={{
                    ...doc,
                    ...(poExtractedData[doc.id] ? {
                      extractedVendor: poExtractedData[doc.id].vendor,
                      extractedDate: poExtractedData[doc.id].date,
                      extractedTotal: poExtractedData[doc.id].total,
                      extractedGst: poExtractedData[doc.id].gst,
                      extractionStatus: "done",
                    } : {}),
                  }} onOpen={handleOpenFile} onExtract={(id) => extractDocument(id, doc.url, doc.fileName)} isExtracting={extractingIds.has(doc.id)} />
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
  onDelete,
  onExtract,
  isExtracting,
  isInvoice,
}: {
  doc: TaxDocument;
  onOpen: (doc: TaxDocument) => void;
  onDelete?: (doc: TaxDocument) => void;
  onExtract?: (docId: string) => void;
  isExtracting?: boolean;
  isInvoice?: boolean;
}) {
  const isPdf = doc.fileType === "pdf";
  const typeLabel = doc.type === "po-pdf"
    ? "PO PDF"
    : doc.type === "po-image"
    ? "Receipt"
    : doc.type === "po-attachment"
    ? "Attachment"
    : doc.type === "uploaded"
    ? (isPdf ? "PDF" : "Image")
    : "Invoice";

  const hasExtractedData = doc.extractionStatus === "done" && (doc.extractedVendor || doc.extractedTotal != null);
  const canExtract = (doc.type === "uploaded" || doc.type === "po-pdf" || doc.type === "po-image" || doc.type === "po-attachment") && doc.extractionStatus !== "extracting" && !isExtracting;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group relative"
      onClick={() => !isInvoice && onOpen(doc)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isPdf ? (
              <FileText className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <Image className="h-5 w-5 text-primary shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{doc.refNumber}</p>
              {(doc.extractedVendor || doc.vendorName) && (
                <p className="text-xs text-muted-foreground truncate">
                  {doc.extractedVendor || doc.vendorName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
            {onDelete && doc.type === "uploaded" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        {/* Extracted data display */}
        {hasExtractedData && (
          <div className="space-y-1 rounded-md bg-muted/50 p-2">
            {doc.extractedDate && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(new Date(doc.extractedDate), "MMM d, yyyy")}</span>
              </div>
            )}
            {doc.extractedVendor && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium truncate max-w-[140px]">{doc.extractedVendor}</span>
              </div>
            )}
            {doc.extractedTotal != null && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">${Number(doc.extractedTotal).toFixed(2)}</span>
              </div>
            )}
            {doc.extractedGst != null && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">GST</span>
                <span className="font-medium">${Number(doc.extractedGst).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(doc.date, "MMM d, yyyy")}</span>
          <div className="flex items-center gap-1">
            {canExtract && onExtract && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={(e) => { e.stopPropagation(); onExtract(doc.id); }}
              >
                <Sparkles className="h-3 w-3" />
                Extract
              </Button>
            )}
            {isExtracting && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Extracting...
              </span>
            )}
            {doc.extractionStatus === "failed" && (
              <Badge variant="destructive" className="text-[10px] h-5">Failed</Badge>
            )}
          </div>
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
