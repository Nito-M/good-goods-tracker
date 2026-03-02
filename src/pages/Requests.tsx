import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests } from "@/hooks/useRequests";
import { useProfile } from "@/hooks/useProfile";
import { useLinkedRequester } from "@/hooks/useLinkedRequester";
import { useBankCards } from "@/hooks/useBankCards";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { RequestersManager } from "@/components/RequestersManager";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ClipboardList, Clock, CheckCircle, ShoppingCart, Package, XCircle, Plus } from "lucide-react";
import { Request, RequestStatus } from "@/types/request";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const STATUS_CONFIG: Record<RequestStatus, {label: string;icon: React.ReactNode;}> = {
  pending: { label: "Pending", icon: <Clock className="h-4 w-4" /> },
  approved: { label: "Approved", icon: <CheckCircle className="h-4 w-4" /> },
  ordered: { label: "Ordered", icon: <ShoppingCart className="h-4 w-4" /> },
  received: { label: "Received", icon: <Package className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-4 w-4" /> }
};

export function Requests() {
  const navigate = useNavigate();
  const { requests, loading, updateStatus, updateCardId, deleteRequest } = useRequests();
  const { profile } = useProfile();
  const { linkedName, allOrgRequesterNames, isAdminUser, refetch: refetchRequesters } = useLinkedRequester();
  const { cards } = useBankCards();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<RequestStatus>("pending");

  // For regular members, only show their own requester name; admins see all
  const visibleRequesterNames = isAdminUser ?
  allOrgRequesterNames.length > 0 ? allOrgRequesterNames : profile?.requesterNames || [] :
  linkedName ? [linkedName] : [];

  // Filter requests: regular members only see requests matching their linked requester name
  const visibleRequests = isAdminUser ?
  requests :
  requests.filter((r) => r.requesterName === linkedName);

  const getFilteredRequests = (status: RequestStatus) => {
    return visibleRequests.filter((request) => {
      const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const searchableText = [
        request.itemName,
        request.sku,
        request.notes,
        request.requesterName,
        request.requestNumber,
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => searchableText.includes(term));
      return matchesSearch && request.status === status;
    });
  };

  const getStatusCount = (status: RequestStatus) => {
    return visibleRequests.filter((r) => r.status === status).length;
  };

  const getRequestTotal = (r: Request) => {
    const subtotal = r.quantity * r.price;
    const gst = subtotal * (r.gstRate / 100);
    return subtotal + gst + (r.extraCost || 0);
  };

  const getStatusTotal = (status: RequestStatus) => {
    return visibleRequests.
    filter((r) => r.status === status).
    reduce((sum, r) => sum + getRequestTotal(r), 0);
  };

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    if (status === 'approved') {
      const req = requests.find((r) => r.id === id);
      if (!req?.bankCardId) {
        toast({
          title: "Card required",
          description: "Please select a bank card on this request before approving it.",
          variant: "destructive"
        });
        return;
      }
    }
    await updateStatus(id, status);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      await deleteRequest(id);
    }
  };

  const handleEdit = (request: Request) => {
    navigate(`/requests/edit/${request.id}`);
  };

  const renderRequestGrid = (status: RequestStatus) => {
    const filteredRequests = getFilteredRequests(status);

    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) =>
          <Skeleton key={i} className="h-64" />
          )}
        </div>);
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No {STATUS_CONFIG[status].label.toLowerCase()} requests</h3>
          <p className="text-muted-foreground">
            {searchQuery ?
            "Try adjusting your search" :
            `No requests with ${STATUS_CONFIG[status].label.toLowerCase()} status`}
          </p>
        </div>);
    }

    // Group requests by requestNumber; ungrouped requests (no requestNumber) stay solo
    const grouped: { key: string; requests: Request[] }[] = [];
    const seen = new Set<string>();

    filteredRequests.forEach((request) => {
      if (seen.has(request.id)) return;
      if (request.requestNumber) {
        const siblings = filteredRequests.filter(
          (r) => r.requestNumber === request.requestNumber
        );
        if (siblings.length > 1 && !seen.has(siblings[0].id)) {
          siblings.forEach((s) => seen.add(s.id));
          grouped.push({ key: request.requestNumber, requests: siblings });
          return;
        }
      }
      seen.add(request.id);
      grouped.push({ key: request.id, requests: [request] });
    });

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {grouped.map((group) => {
          if (group.requests.length === 1) {
            const request = group.requests[0];
            const isOwnRequest = linkedName && request.requesterName === linkedName;
            const canManage = isAdminUser || isOwnRequest;
            return (
              <RequestCard
                key={request.id}
                request={request}
                cards={cards}
                onStatusChange={isAdminUser ? handleStatusChange : undefined}
                onCardChange={(cardId) => updateCardId(request.id, cardId)}
                onDelete={canManage ? handleDelete : undefined}
                onEdit={canManage ? handleEdit : undefined} />
            );
          }

          // Grouped requests — render inside a shared container
          const groupTotal = group.requests.reduce((s, r) => s + getRequestTotal(r), 0);
          return (
            <div key={group.key} className="rounded-xl border-2 border-primary/20 bg-primary/[0.02] p-2 space-y-2">
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {group.key}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {group.requests.length} items · {formatCurrency(groupTotal)}
                </span>
              </div>
              {group.requests.map((request) => {
                const isOwnRequest = linkedName && request.requesterName === linkedName;
                const canManage = isAdminUser || isOwnRequest;
                return (
                  <RequestCard
                    key={request.id}
                    request={request}
                    cards={cards}
                    onStatusChange={isAdminUser ? handleStatusChange : undefined}
                    onCardChange={(cardId) => updateCardId(request.id, cardId)}
                    onDelete={canManage ? handleDelete : undefined}
                    onEdit={canManage ? handleEdit : undefined} />
                );
              })}
            </div>
          );
        })}
      </div>);
  };

  return (
    <div className="space-y-6">
      {/* Admin: Manage Requesters */}
      {isAdminUser &&
      <RequestersManager onRequestersChanged={refetchRequesters} />
      }

      {/* Header */}
      <div className="flex justify-end gap-4 bg-inherit">
        <Button onClick={() => navigate("/requests/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9" />

      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RequestStatus)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((status) =>
          <TabsTrigger key={status} value={status} className="flex items-center gap-1.5 py-1.5 px-2">
              {STATUS_CONFIG[status].icon}
              <span className="hidden sm:inline">{STATUS_CONFIG[status].label}</span>
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                {getStatusCount(status)}
              </Badge>
              <span className="hidden sm:inline text-[11px] text-muted-foreground font-medium opacity-75">
                {formatCurrency(getStatusTotal(status))}
              </span>
            </TabsTrigger>
          )}
        </TabsList>

        {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((status) =>
        <TabsContent key={status} value={status}>
            {renderRequestGrid(status)}
          </TabsContent>
        )}
      </Tabs>

    </div>);

}