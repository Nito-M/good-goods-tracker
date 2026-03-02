import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRequests } from "@/hooks/useRequests";
import { useRequestSubItems } from "@/hooks/useRequestSubItems";
import { useLinkedRequester } from "@/hooks/useLinkedRequester";
import { useBankCards } from "@/hooks/useBankCards";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Pencil, Trash2, ExternalLink, FileText, CreditCard, User, Image, ChevronDown, ChevronRight, Plus, Star, X } from "lucide-react";
import { Request, RequestStatus } from "@/types/request";
import { formatCurrency } from "@/lib/utils";

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
  const { requests, loading, updateStatus, updateCardId, deleteRequest } = useRequests();
  const { linkedName, isAdminUser } = useLinkedRequester();
  const { cards } = useBankCards();
  const { toast } = useToast();

  const decodedNumber = requestNumber ? decodeURIComponent(requestNumber) : "";

  const groupRequests = useMemo(
    () => requests.filter((r) => r.requestNumber === decodedNumber),
    [requests, decodedNumber]
  );

  const requestIds = useMemo(() => groupRequests.map((r) => r.id), [groupRequests]);
  const { subItems, addSubItem, deleteSubItem, toggleSelected } = useRequestSubItems(requestIds);

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
          <div>
            <h1 className="text-2xl font-bold font-mono">{decodedNumber}</h1>
            {firstReq?.requesterName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> {firstReq.requesterName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete All
            </Button>
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
            <div className="text-sm text-muted-foreground">
              Need by: {format(new Date(firstReq.needByDate), "MMM d, yyyy")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items ({groupRequests.length})</CardTitle>
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
                    onDeleteSubItem={deleteSubItem}
                    onToggleSelected={(id) => toggleSelected(id, r.id)}
                    onEdit={() => navigate(`/requests/edit/${r.id}`)}
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
    </div>
  );
}

// --- Sub-component for each item row with collapsible sub-items ---

interface RequestItemRowProps {
  request: Request;
  lineTotal: number;
  canManage: boolean;
  subItems: { id: string; vendorName: string; unitPrice: number; link: string | null; notes: string | null; isSelected: boolean }[];
  onAddSubItem: (input: { vendorName: string; unitPrice: number; link?: string | null; notes?: string | null }) => Promise<boolean>;
  onDeleteSubItem: (id: string) => Promise<boolean>;
  onToggleSelected: (id: string) => Promise<boolean>;
  onEdit: () => void;
}

function RequestItemRow({ request: r, lineTotal, canManage, subItems, onAddSubItem, onDeleteSubItem, onToggleSelected, onEdit }: RequestItemRowProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!vendorName.trim()) return;
    setSaving(true);
    const ok = await onAddSubItem({
      vendorName: vendorName.trim(),
      unitPrice: parseFloat(unitPrice) || 0,
      link: link.trim() || null,
      notes: notes.trim() || null,
    });
    if (ok) {
      setVendorName("");
      setUnitPrice("");
      setLink("");
      setNotes("");
      setShowForm(false);
    }
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
                  <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
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
                  <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => setShowForm(!showForm)}>
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
                  className={`flex items-center gap-3 text-sm p-2 rounded border ${si.isSelected ? "bg-primary/5 border-primary/30" : "bg-background border-border/50"}`}
                >
                  <button onClick={() => onToggleSelected(si.id)} className="shrink-0">
                    <Star className={`h-4 w-4 ${si.isSelected ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{si.vendorName}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatCurrency(si.unitPrice)}</span>
                      {si.link && (
                        <a href={si.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </div>
                    {si.notes && <p className="text-xs text-muted-foreground mt-0.5">{si.notes}</p>}
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onDeleteSubItem(si.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}

              {showForm && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-background border rounded">
                  <Input placeholder="Vendor name *" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="col-span-2 h-8 text-sm" />
                  <Input placeholder="Unit price" type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-2 h-8 text-sm" />
                  <div className="col-span-2 flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={saving || !vendorName.trim()}>
                      {saving ? "Saving..." : "Add"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
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
