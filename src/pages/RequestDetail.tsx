import { useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRequests } from "@/hooks/useRequests";
import { useRequestSubItems } from "@/hooks/useRequestSubItems";
import { useRequestImages } from "@/hooks/useRequestImages";
import { useLinkedRequester } from "@/hooks/useLinkedRequester";
import { useBankCards } from "@/hooks/useBankCards";
import { useVendors } from "@/hooks/useVendors";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Pencil, Trash2, ExternalLink, FileText, CreditCard, User, Image, ChevronDown, ChevronRight, ChevronLeft, Plus, Star, X, Store, Upload } from "lucide-react";
import { ImageViewerDialog } from "@/components/ImageViewerDialog";
import { AddItemToRequestDialog } from "@/components/AddItemToRequestDialog";
import { Request, RequestStatus } from "@/types/request";
import { formatCurrency } from "@/lib/utils";
import { downloadFileFromUrl, getFileNameFromUrl } from "@/lib/fileDownload";

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ordered: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  received: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function RequestDetail() {
  const { requestNumber } = useParams<{ requestNumber: string }>();
  const navigate = useNavigate();
  const { requests, loading, updateStatus, updateCardId, updateRequest, deleteRequest, addRequest, uploadImage, uploadPdf } = useRequests();
  const { linkedName, isAdminUser } = useLinkedRequester();
  const { cards } = useBankCards();
  const { vendors } = useVendors();
  const { allItems } = useInventory();
  const { toast } = useToast();
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);

  const decodedNumber = requestNumber ? decodeURIComponent(requestNumber) : "";

  const groupRequests = useMemo(
    () => requests.filter((r) => r.requestNumber === decodedNumber),
    [requests, decodedNumber]
  );

  // Store the original status when first loaded so navigation context doesn't shift on status change
  const originalStatusRef = useRef<RequestStatus | null>(null);
  if (originalStatusRef.current === null && groupRequests.length > 0) {
    originalStatusRef.current = groupRequests[0].status;
  }

  const navigationStatus = originalStatusRef.current;

  // Unique request numbers filtered by the original status, sorted by most recent first
  const allRequestNumbers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of requests) {
      if (r.requestNumber && (r.status === navigationStatus || r.requestNumber === decodedNumber) && (!seen.has(r.requestNumber) || r.createdAt > seen.get(r.requestNumber)!)) {
        seen.set(r.requestNumber, r.createdAt);
      }
    }
    return Array.from(seen.entries())
      .sort((a, b) => b[1].localeCompare(a[1]))
      .map(([num]) => num);
  }, [requests, navigationStatus]);

  const currentIndex = allRequestNumbers.indexOf(decodedNumber);
  const prevRequestNumber = currentIndex > 0 ? allRequestNumbers[currentIndex - 1] : null;
  const nextRequestNumber = currentIndex < allRequestNumbers.length - 1 ? allRequestNumbers[currentIndex + 1] : null;

  const navigateToRequest = (reqNum: string) => {
    navigate(`/requests/view/${encodeURIComponent(reqNum)}`);
  };

  const requestIds = useMemo(() => groupRequests.map((r) => r.id), [groupRequests]);
  const { subItems, addSubItem, updateSubItem, deleteSubItem, toggleSelected } = useRequestSubItems(requestIds);
  const { images: requestImages, addImage: addRequestImage, deleteImage: deleteRequestImage } = useRequestImages(requestIds);

  const getTotal = (r: Request) => {
    const subtotal = r.quantity * r.price;
    const gst = subtotal * (r.gstRate / 100);
    return subtotal + gst + (r.extraCost || 0);
  };

  const groupTotal = groupRequests.reduce((s, r) => s + getTotal(r), 0);
  const firstReq = groupRequests[0];

  const handleStatusChange = async (status: RequestStatus) => {
    if (status === "approved") {
      const allHaveCard = groupRequests.every((r) => r.bankCardId);
      if (!allHaveCard) {
        toast({ title: "Card required", description: "Please assign a bank card before approving.", variant: "destructive" });
        return;
      }
    }
    for (const r of groupRequests) {
      await updateStatus(r.id, status);
    }
  };

  const handleCardChange = async (cardId: string | null) => {
    for (const r of groupRequests) {
      await updateCardId(r.id, cardId);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete all ${groupRequests.length} items in ${decodedNumber}?`)) return;
    for (const r of groupRequests) {
      await deleteRequest(r.id);
    }
    navigate("/requests");
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (groupRequests.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Request not found.</p>
        <Button variant="outline" onClick={() => navigate("/requests")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Requests
        </Button>
      </div>
    );
  }

  const canManage = isAdminUser || (linkedName && firstReq?.requesterName === linkedName);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/requests")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!prevRequestNumber}
            onClick={() => prevRequestNumber && navigateToRequest(prevRequestNumber)}
            title={prevRequestNumber ? `Previous: ${prevRequestNumber}` : "No previous request"}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold font-mono">{decodedNumber}</h1>
            {/* Editable Title */}
            {editingTitle ? (
              <form
                className="flex items-center gap-1 mt-1"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const newTitle = titleDraft.trim() || null;
                  for (const r of groupRequests) {
                    await updateRequest(r.id, { title: newTitle });
                  }
                  setEditingTitle(false);
                }}
              >
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  placeholder="Enter request title..."
                  className="h-7 text-sm w-56"
                  onKeyDown={(e) => { if (e.key === "Escape") setEditingTitle(false); }}
                />
                <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs">Save</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingTitle(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </form>
            ) : (
              <button
                className="flex items-center gap-1 mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                onClick={() => { setTitleDraft(firstReq?.title || ""); setEditingTitle(true); }}
              >
                {firstReq?.title ? (
                  <span className="font-medium text-foreground">{firstReq.title}</span>
                ) : (
                  <span className="italic">Add title...</span>
                )}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            {firstReq?.requesterName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> {firstReq.requesterName}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            disabled={!nextRequestNumber}
            onClick={() => nextRequestNumber && navigateToRequest(nextRequestNumber)}
            title={nextRequestNumber ? `Next: ${nextRequestNumber}` : "No next request"}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <label
                className={`cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border transition-colors ${
                  imageDragOver
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                } ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                onDragLeave={() => setImageDragOver(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setImageDragOver(false);
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                  if (files.length === 0 || !firstReq) return;
                  setUploadingImage(true);
                  try {
                    for (const file of files) {
                      const url = await uploadImage(file);
                      if (url) await addRequestImage(firstReq.id, url);
                    }
                    toast({ title: "Image uploaded", description: `${files.length} image(s) added` });
                  } catch {
                    toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                  } finally {
                    setUploadingImage(false);
                  }
                }}
              >
                <Upload className="h-4 w-4" />
                {uploadingImage ? "Uploading..." : imageDragOver ? "Drop here" : "Add Image"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0 || !firstReq) return;
                    setUploadingImage(true);
                    try {
                      for (const file of files) {
                        const url = await uploadImage(file);
                        if (url) await addRequestImage(firstReq.id, url);
                      }
                      toast({ title: "Image uploaded", description: `${files.length} image(s) added` });
                    } catch {
                      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                    } finally {
                      setUploadingImage(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete All
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status + Card Controls */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {isAdminUser && firstReq?.status !== "cancelled" ? (
              <Select value={firstReq?.status} onValueChange={(v) => handleStatusChange(v as RequestStatus)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={statusColors[firstReq?.status || "pending"]}>
                {firstReq?.status?.charAt(0).toUpperCase()}{firstReq?.status?.slice(1)}
              </Badge>
            )}
          </div>

          {/* Vendor */}
          <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg border border-accent">
            <Store className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide mr-1">Vendor</span>
            {vendors.length > 0 && (
              <Select
                value={vendors.some(v => v.name === firstReq?.vendorName) ? (firstReq?.vendorName ?? "") : ""}
                onValueChange={async (val) => {
                  for (const r of groupRequests) {
                    await updateRequest(r.id, { vendorName: val || null });
                  }
                }}
              >
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue placeholder={firstReq?.vendorName || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {firstReq?.vendorName && !vendors.some(v => v.name === firstReq?.vendorName) && (
              <Badge variant="secondary" className="text-sm">{firstReq.vendorName}</Badge>
            )}
          </div>

          {cards.length > 0 && (
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Select value={firstReq?.bankCardId ?? ""} onValueChange={(v) => handleCardChange(v || null)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select card..." />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${card.color} shrink-0`} />
                        {card.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {firstReq?.needByDate && (
            <div className="text-sm text-destructive font-medium">
              Need by: {format(new Date(firstReq.needByDate), "MMM d, yyyy")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Items ({groupRequests.length})</CardTitle>
          {canManage && (
            <AddItemToRequestDialog
              items={allItems}
              requestNumber={decodedNumber}
              requesterName={firstReq?.requesterName || null}
              onSave={async (input) => {
                await addRequest({
                  ...input,
                  requestNumber: decodedNumber,
                  requesterName: firstReq?.requesterName || null,
                  vendorName: firstReq?.vendorName || null,
                });
              }}
              onUploadImage={uploadImage}
              onUploadPdf={uploadPdf}
            />
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Extra</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupRequests.map((r) => {
                const lineTotal = getTotal(r);
                const itemSubItems = subItems.filter((s) => s.requestId === r.id);
                return (
                  <RequestItemRow
                    key={r.id}
                    request={r}
                    lineTotal={lineTotal}
                    canManage={!!canManage}
                    subItems={itemSubItems}
                    onAddSubItem={(input) => addSubItem(r.id, input)}
                    onUpdateSubItem={updateSubItem}
                    onDeleteSubItem={deleteSubItem}
                    onToggleSelected={async (id) => {
                      const ok = await toggleSelected(id, r.id);
                      if (ok) {
                        const selectedSub = itemSubItems.find(s => s.id === id);
                        if (selectedSub) {
                          await updateRequest(r.id, {
                            price: selectedSub.unitPrice,
                            vendorName: selectedSub.vendorName,
                          });
                        }
                      }
                      return ok;
                    }}
                    onEdit={() => navigate(`/requests/edit/${r.id}`)}
                    onDelete={canManage ? async () => {
                      if (!confirm(`Delete "${r.itemName}" from this request?`)) return;
                      await deleteRequest(r.id);
                      if (groupRequests.length <= 1) navigate("/requests");
                    } : undefined}
                  />
                );
              })}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={5} className="text-right">Total</TableCell>
                <TableCell className="text-right text-lg text-green-600">{formatCurrency(groupTotal)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Images */}
      {(groupRequests.some(r => r.imageUrl) || requestImages.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5" /> Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Item-level images */}
              {groupRequests.filter(r => r.imageUrl).map((r) => (
                <div
                  key={`item-${r.id}`}
                  className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity group"
                  onClick={() => {
                    setViewerImageUrl(r.imageUrl);
                    setImageViewerOpen(true);
                  }}
                >
                  <img src={r.imageUrl!} alt={r.itemName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Click to view</span>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-background/80 rounded px-1.5 py-0.5 text-[10px] font-medium truncate max-w-[90%]">
                    {r.itemName}
                  </div>
                </div>
              ))}
              {/* Uploaded request images */}
              {requestImages.map((img) => (
                <div
                  key={`req-img-${img.id}`}
                  className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity group"
                  onClick={() => {
                    setViewerImageUrl(img.imageUrl);
                    setImageViewerOpen(true);
                  }}
                >
                  <img src={img.imageUrl} alt="Request image" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Click to view</span>
                  </div>
                  {canManage && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRequestImage(img.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ImageViewerDialog
        imageUrl={viewerImageUrl}
        alt="Request Image"
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
      />
    </div>
  );
}

// --- Sub-component for each item row with collapsible sub-items ---

interface RequestItemRowProps {
  request: Request;
  lineTotal: number;
  canManage: boolean;
  subItems: { id: string; vendorName: string; unitPrice: number; quantity: number; link: string | null; notes: string | null; sku: string | null; imageUrl: string | null; isSelected: boolean }[];
  onAddSubItem: (input: { vendorName: string; unitPrice: number; quantity?: number; link?: string | null; notes?: string | null; sku?: string | null; imageUrl?: string | null }) => Promise<boolean>;
  onUpdateSubItem: (id: string, updates: { vendorName?: string; unitPrice?: number; quantity?: number; link?: string | null; notes?: string | null; sku?: string | null; imageUrl?: string | null }) => Promise<boolean>;
  onDeleteSubItem: (id: string) => Promise<boolean>;
  onToggleSelected: (id: string) => Promise<boolean>;
  onEdit: () => void;
  onDelete?: () => void;
}

function RequestItemRow({ request: r, lineTotal, canManage, subItems, onAddSubItem, onUpdateSubItem, onDeleteSubItem, onToggleSelected, onEdit, onDelete }: RequestItemRowProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [sku, setSku] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setVendorName("");
    setUnitPrice("");
    setQuantity("1");
    setLink("");
    setNotes("");
    setSku("");
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (si: typeof subItems[0]) => {
    setEditingId(si.id);
    setVendorName(si.vendorName);
    setUnitPrice(String(si.unitPrice));
    setQuantity(String(si.quantity));
    setLink(si.link || "");
    setNotes(si.notes || "");
    setSku(si.sku || "");
    setImageFile(null);
    setImagePreview(si.imageUrl || null);
    setExistingImageUrl(si.imageUrl || null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!vendorName.trim()) return;
    setSaving(true);

    // Upload image if new file selected
    let finalImageUrl: string | null = existingImageUrl;
    if (imageFile) {
      // Use the same upload mechanism - upload to supabase storage
      const { supabase } = await import("@/integrations/supabase/client");
      const ext = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from("request-images").upload(fileName, imageFile);
      if (!error && data) {
        const { data: signedData } = await supabase.storage.from("request-images").createSignedUrl(data.path, 60 * 60 * 24 * 365);
        finalImageUrl = signedData?.signedUrl || null;
      }
    }

    let ok: boolean;
    if (editingId) {
      ok = await onUpdateSubItem(editingId, {
        vendorName: vendorName.trim(),
        unitPrice: parseFloat(unitPrice) || 0,
        quantity: parseFloat(quantity) || 1,
        link: link.trim() || null,
        notes: notes.trim() || null,
        sku: sku.trim() || null,
        imageUrl: finalImageUrl,
      });
    } else {
      ok = await onAddSubItem({
        vendorName: vendorName.trim(),
        unitPrice: parseFloat(unitPrice) || 0,
        quantity: parseFloat(quantity) || 1,
        link: link.trim() || null,
        notes: notes.trim() || null,
        sku: sku.trim() || null,
        imageUrl: finalImageUrl,
      });
    }
    if (ok) resetForm();
    setSaving(false);
  };

  return (
    <>
      <TableRow className="group">
        <TableCell>
          <div className="flex items-center gap-1">
            <button onClick={() => setOpen(!open)} className="p-0.5 rounded hover:bg-muted">
              {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            <div>
              <div className="font-medium">{r.itemName}</div>
              {r.sku && <div className="text-xs text-muted-foreground font-mono">{r.sku}</div>}
              <div className="flex flex-wrap gap-2 mt-1">
                {r.imageUrl && (
                  <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                    <Image className="h-3 w-3" /> Image
                  </a>
                )}
                {r.pdfUrl && (
                  <a
                    href={r.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={async (e) => {
                      e.preventDefault();
                      await downloadFileFromUrl(
                        r.pdfUrl!,
                        getFileNameFromUrl(r.pdfUrl!, `${r.requestNumber || "request"}-${r.itemName || "attachment"}.pdf`)
                      );
                    }}
                    className="text-xs text-primary flex items-center gap-0.5 hover:underline"
                  >
                    <FileText className="h-3 w-3" /> PDF
                  </a>
                )}
                {r.link && (
                  <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Link
                  </a>
                )}
              </div>
              {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.notes}</p>}
            </div>
          </div>
          {subItems.length > 0 && (
            <Badge variant="secondary" className="text-[10px] mt-1 ml-5">
              {subItems.length} vendor option{subItems.length > 1 ? "s" : ""}
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right whitespace-nowrap">{r.quantity} {r.quantityUnit}</TableCell>
        <TableCell className="text-right">{formatCurrency(r.price)}</TableCell>
        <TableCell className="text-right">{r.gstRate > 0 ? `${r.gstRate}%` : "—"}</TableCell>
        <TableCell className="text-right">{r.extraCost > 0 ? formatCurrency(r.extraCost) : "—"}</TableCell>
        <TableCell className="text-right font-semibold">{formatCurrency(lineTotal)}</TableCell>
        <TableCell>
          {canManage && (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {onDelete && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </TableCell>
      </TableRow>

      {/* Sub-items expandable row */}
      {open && (
        <TableRow>
          <TableCell colSpan={7} className="p-0 border-0">
            <div className="bg-muted/30 border-l-2 border-primary/20 ml-4 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vendor Options</span>
                {canManage && (
                  <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                )}
              </div>

              {subItems.length === 0 && !showForm && (
                <p className="text-xs text-muted-foreground">No vendor options yet.</p>
              )}

              {subItems.map((si) => (
                <div
                  key={si.id}
                  className={`flex items-start gap-3 text-sm p-2 rounded border ${si.isSelected ? "bg-primary/5 border-primary/30" : "bg-background border-border/50"}`}
                >
                  <button onClick={() => onToggleSelected(si.id)} className="shrink-0 mt-1">
                    <Star className={`h-4 w-4 ${si.isSelected ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </button>
                  {si.imageUrl && (
                    <img src={si.imageUrl} alt={si.vendorName} className="h-12 w-12 rounded border object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{si.vendorName}</div>
                    {si.sku && <div className="text-xs text-muted-foreground font-mono">{si.sku}</div>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>×{si.quantity}</span>
                      <span>@ {formatCurrency(si.unitPrice)}</span>
                      <span className="font-semibold text-foreground">= {formatCurrency(si.unitPrice * si.quantity)}</span>
                      {si.link && (
                        <a href={si.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </div>
                    {si.notes && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap break-all overflow-hidden max-w-full">{si.notes}</p>}
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(si)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeleteSubItem(si.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {showForm && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-background border rounded">
                  <Input placeholder="Vendor name *" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="col-span-2 h-8 text-sm" />
                  <Input placeholder="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} className="col-span-2 h-8 text-sm" />
                  <Input placeholder="Quantity" type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Unit price" type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-2 h-8 text-sm" />
                  {/* Image upload */}
                  <div className="col-span-2">
                    {imagePreview ? (
                      <div className="relative w-full h-20 rounded border overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5" onClick={() => { setImageFile(null); setImagePreview(null); setExistingImageUrl(null); }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 w-full h-8 px-3 border border-dashed rounded cursor-pointer hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload image (optional)</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving || !vendorName.trim()}>
                      {saving ? "Saving..." : editingId ? "Update" : "Add"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetForm}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
