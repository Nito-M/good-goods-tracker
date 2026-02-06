import { useState } from "react";
import { useRequests } from "@/hooks/useRequests";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { AddRequestDialog } from "@/components/AddRequestDialog";
import { EditRequestDialog } from "@/components/EditRequestDialog";
import { RequestCard } from "@/components/RequestCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ClipboardList } from "lucide-react";
import { Request, RequestStatus } from "@/types/request";

export function Requests() {
  const { requests, loading, addRequest, updateRequest, updateStatus, deleteRequest, uploadImage } = useRequests();
  const { allItems } = useInventory();
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (request.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        <AddRequestDialog
          items={allItems}
          requesterNames={profile?.requesterNames || []}
          onSave={addRequest}
          onUploadImage={uploadImage}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No requests found</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first request to get started"}
          </p>
        </div>
      ) : (
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
      )}

      {/* Edit Dialog */}
      <EditRequestDialog
        request={editingRequest}
        items={allItems}
        requesterNames={profile?.requesterNames || []}
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        onSave={updateRequest}
        onUploadImage={uploadImage}
      />
    </div>
  );
}
