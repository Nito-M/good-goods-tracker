import { useState } from "react";
import { useRequests } from "@/hooks/useRequests";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { useOrgRequesterNames } from "@/hooks/useOrgRequesterNames";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { AddRequestDialog } from "@/components/AddRequestDialog";
import { EditRequestDialog } from "@/components/EditRequestDialog";
import { RequestCard } from "@/components/RequestCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ClipboardList, Clock, CheckCircle, ShoppingCart, Package, XCircle, LogOut } from "lucide-react";
import { Request, RequestStatus } from "@/types/request";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<RequestStatus, { label: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", icon: <Clock className="h-4 w-4" /> },
  approved: { label: "Approved", icon: <CheckCircle className="h-4 w-4" /> },
  ordered: { label: "Ordered", icon: <ShoppingCart className="h-4 w-4" /> },
  received: { label: "Received", icon: <Package className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-4 w-4" /> },
};

export function Requests() {
  const { requests, loading, addRequest, updateRequest, updateStatus, deleteRequest, uploadImage } = useRequests();
  const { allItems } = useInventory();
  const { profile } = useProfile();
  const { requesterNames, myRequesterName } = useOrgRequesterNames();
  const { isAdmin } = usePagePermissions();
  const { organization } = useUserOrganization();
  const isOrgAdmin = organization?.role === 'owner' || organization?.role === 'admin';
  const canSeeAll = isAdmin || isOrgAdmin;
  const { signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [activeTab, setActiveTab] = useState<RequestStatus>("pending");

  // Filter requests: admins see all, regular members only see their linked requester name
  const visibleRequests = canSeeAll
    ? requests
    : requests.filter((r) => myRequesterName && r.requesterName === myRequesterName);

  const getFilteredRequests = (status: RequestStatus) => {
    return visibleRequests.filter((request) => {
      const matchesSearch =
        request.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (request.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesSearch && request.status === status;
    });
  };

  const getStatusCount = (status: RequestStatus) => {
    return visibleRequests.filter((r) => r.status === status).length;
  };

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    await updateStatus(id, status);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      await deleteRequest(id);
    }
  };

  const handleEdit = (request: Request) => {
    setEditingRequest(request);
  };

  const renderRequestGrid = (status: RequestStatus) => {
    const filteredRequests = getFilteredRequests(status);

    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No {STATUS_CONFIG[status].label.toLowerCase()} requests</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search"
              : `No requests with ${STATUS_CONFIG[status].label.toLowerCase()} status`}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRequests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Track item requests and custom orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddRequestDialog
            items={allItems}
            requesterNames={canSeeAll ? requesterNames : (myRequesterName ? [myRequesterName] : [])}
            onSave={addRequest}
            onUploadImage={uploadImage}
          />
          <Button variant="outline" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RequestStatus)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((status) => (
            <TabsTrigger key={status} value={status} className="flex items-center gap-2">
              {STATUS_CONFIG[status].icon}
              <span className="hidden sm:inline">{STATUS_CONFIG[status].label}</span>
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                {getStatusCount(status)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((status) => (
          <TabsContent key={status} value={status}>
            {renderRequestGrid(status)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <EditRequestDialog
        request={editingRequest}
        items={allItems}
        requesterNames={canSeeAll ? requesterNames : (myRequesterName ? [myRequesterName] : [])}
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        onSave={updateRequest}
        onUploadImage={uploadImage}
      />
    </div>
  );
}
