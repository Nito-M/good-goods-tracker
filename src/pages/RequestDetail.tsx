import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRequests } from "@/hooks/useRequests";
import { useLinkedRequester } from "@/hooks/useLinkedRequester";
import { useBankCards } from "@/hooks/useBankCards";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Pencil, Trash2, ExternalLink, FileText, CreditCard, User, Image } from "lucide-react";
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
          {/* Status */}
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

          {/* Card */}
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
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.itemName}</div>
                      {r.sku && <div className="text-xs text-muted-foreground font-mono">{r.sku}</div>}
                      {/* Inline attachments & notes */}
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
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{r.quantity} {r.quantityUnit}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.price)}</TableCell>
                    <TableCell className="text-right">{r.gstRate > 0 ? `${r.gstRate}%` : "—"}</TableCell>
                    <TableCell className="text-right">{r.extraCost > 0 ? formatCurrency(r.extraCost) : "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(lineTotal)}</TableCell>
                    <TableCell>
                      {canManage && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/requests/edit/${r.id}`)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Total row */}
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
