import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useRequests } from "@/hooks/useRequests";
import { useVendors } from "@/hooks/useVendors";
import { useProfile } from "@/hooks/useProfile";
import { useLinkedRequester } from "@/hooks/useLinkedRequester";
import { useBankCards } from "@/hooks/useBankCards";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/RequestCard";
import { RequestersManager } from "@/components/RequestersManager";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ClipboardList, Clock, CheckCircle, ShoppingCart, Package, XCircle, Plus, CreditCard, CalendarClock, User, FileText, Upload, Trash2, Pencil, Store, LayoutList, LayoutGrid } from "lucide-react";
import { Request, RequestStatus } from "@/types/request";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { downloadFileFromUrl, getFileNameFromUrl } from "@/lib/fileDownload";

const GRADIENT_COLOR_MAP: Record<string, string> = {
  'from-blue-600': '#2563eb', 'from-purple-600': '#9333ea', 'from-green-600': '#16a34a',
  'from-red-600': '#dc2626', 'from-orange-600': '#ea580c', 'from-pink-600': '#db2777',
  'from-teal-600': '#0d9488', 'from-indigo-600': '#4f46e5', 'from-yellow-600': '#ca8a04',
  'from-cyan-600': '#0891b2', 'from-emerald-600': '#059669', 'from-rose-600': '#e11d48',
  'from-violet-600': '#7c3aed', 'from-amber-600': '#d97706', 'from-lime-600': '#65a30d',
  'from-fuchsia-600': '#c026d3', 'from-sky-600': '#0284c7', 'from-stone-600': '#57534e',
  'from-slate-600': '#475569', 'from-zinc-600': '#52525b', 'from-neutral-600': '#525252',
  'from-gray-600': '#4b5563', 'from-red-500': '#ef4444', 'from-blue-500': '#3b82f6',
  'from-green-500': '#22c55e', 'from-purple-500': '#a855f7',
  'from-orange-500': '#f97316', 'from-teal-500': '#14b8a6', 'from-cyan-500': '#06b6d4',
  'from-pink-500': '#ec4899', 'from-rose-500': '#f43f5e', 'from-amber-500': '#f59e0b',
  'from-yellow-500': '#eab308', 'from-lime-500': '#84cc16', 'from-sky-500': '#0ea5e9',
  'from-blue-900': '#1e3a8a', 'from-green-700': '#15803d', 'from-purple-400': '#c084fc',
  'from-red-700': '#b91c1c',
};
function getCardCssColor(gradientClass: string): string | undefined {
  const match = gradientClass.match(/from-\w+-\d+/);
  return match ? GRADIENT_COLOR_MAP[match[0]] : undefined;
}

const STATUS_CONFIG: Record<RequestStatus, {label: string;icon: React.ReactNode;}> = {
  pending: { label: "Pending", icon: <Clock className="h-4 w-4" /> },
  approved: { label: "Approved", icon: <CheckCircle className="h-4 w-4" /> },
  ordered: { label: "Ordered", icon: <ShoppingCart className="h-4 w-4" /> },
  received: { label: "Received", icon: <Package className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-4 w-4" /> }
};

function GroupPdfUpload({ uploadPdf }: { requests: Request[]; uploadPdf: (file: File) => Promise<string | null> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadPdf(file);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs h-7"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3 w-3 mr-1" />
        {uploading ? "Uploading..." : "Upload PDF"}
      </Button>
    </div>
  );
}

export function Requests() {
  const navigate = useNavigate();
  const { requests, loading, updateStatus, updateCardId, updateRequest, deleteRequest, uploadPdf } = useRequests();
  const { vendors } = useVendors();
  const { profile } = useProfile();
  const { linkedName, allOrgRequesterNames, isAdminUser, refetch: refetchRequesters } = useLinkedRequester();
  const { cards } = useBankCards();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<RequestStatus>("pending");
  const [filterVendor, setFilterVendor] = useState<string>("all");
  const [filterRequester, setFilterRequester] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'lines' | 'cards'>(() => {
    return (localStorage.getItem('requestsViewMode') as 'lines' | 'cards') || 'cards';
  });

  // For regular members, only show their own requester name; admins see all
  const visibleRequesterNames = isAdminUser ?
  allOrgRequesterNames.length > 0 ? allOrgRequesterNames : profile?.requesterNames || [] :
  linkedName ? [linkedName] : [];

  // Filter requests: regular members only see requests matching their linked requester name
  const visibleRequests = isAdminUser ?
  requests :
  requests.filter((r) => r.requesterName === linkedName);

  // Collect unique vendor names and requester names from visible requests
  const uniqueVendors = Array.from(new Set(visibleRequests.map(r => r.vendorName).filter(Boolean) as string[])).sort();
  const uniqueRequesters = Array.from(new Set(visibleRequests.map(r => r.requesterName).filter(Boolean) as string[])).sort();

  const getFilteredRequests = (status: RequestStatus) => {
    return visibleRequests.filter((request) => {
      const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const searchableText = [
        request.title,
        request.itemName,
        request.sku,
        request.notes,
        request.requesterName,
        request.requestNumber,
        request.vendorName,
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => searchableText.includes(term));
      const matchesVendor = filterVendor === "all" || request.vendorName === filterVendor;
      const matchesRequester = filterRequester === "all" || request.requesterName === filterRequester;
      return matchesSearch && matchesVendor && matchesRequester && request.status === status;
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

  const renderRequestList = (status: RequestStatus) => {
    const filteredRequests = getFilteredRequests(status);

    if (loading) {
      return (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No {STATUS_CONFIG[status].label.toLowerCase()} requests</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search" : `No requests with ${STATUS_CONFIG[status].label.toLowerCase()} status`}
          </p>
        </div>
      );
    }

    // Group same as card view
    const grouped: { key: string; requests: Request[] }[] = [];
    const seen = new Set<string>();
    filteredRequests.forEach((request) => {
      if (seen.has(request.id)) return;
      if (request.requestNumber) {
        const siblings = filteredRequests.filter((r) => r.requestNumber === request.requestNumber);
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
      <div className="border border-border rounded-md overflow-hidden">
        {grouped.map((group, i) => {
          const groupTotal = group.requests.reduce((s, r) => s + getRequestTotal(r), 0);
          const firstReq = group.requests[0];
          const isOverdue = firstReq.needByDate && new Date(firstReq.needByDate) < new Date() && firstReq.status !== 'received' && firstReq.status !== 'cancelled';
          const vendorObj = vendors.find(v => v.name === firstReq.vendorName);
          const vendorColor = vendorObj?.color || undefined;

          return (
            <div
              key={group.key}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${i > 0 ? 'border-t border-border' : ''}`}
              onClick={() => {
                const navKey = firstReq.requestNumber || group.key;
                navigate(`/requests/view/${encodeURIComponent(navKey)}`);
              }}
            >
              {/* Request number */}
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0 w-24 text-center truncate">
                {firstReq.requestNumber || '—'}
              </span>

              {/* Item names - colored by vendor */}
              <span
                className="font-medium truncate flex-1 min-w-0"
                style={vendorColor ? { color: vendorColor } : undefined}
              >
                {group.requests.length === 1
                  ? (firstReq.title || firstReq.itemName)
                  : `${firstReq.title || firstReq.itemName} +${group.requests.length - 1} more`}
              </span>

              {/* Requester */}
              {firstReq.requesterName && (
                <span className="text-xs text-muted-foreground truncate w-24 shrink-0 hidden md:block">
                  {firstReq.requesterName}
                </span>
              )}

              {/* Vendor - inline select */}
              <div className="shrink-0 hidden lg:block w-32" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={firstReq.vendorName || "__none__"}
                  onValueChange={async (val) => {
                    const newVendor = val === "__none__" ? null : val;
                    // Update all requests in this group
                    for (const r of group.requests) {
                      await updateRequest(r.id, { vendorName: newVendor });
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs border-none bg-transparent shadow-none px-1">
                    <SelectValue placeholder="No vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No vendor</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.name}>
                        <div className="flex items-center gap-2">
                          {v.color && <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />}
                          {v.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Card - inline select */}
              <div className="shrink-0 hidden lg:block w-28" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={firstReq.bankCardId || "__none__"}
                  onValueChange={async (val) => {
                    const newCardId = val === "__none__" ? null : val;
                    for (const r of group.requests) {
                      await updateCardId(r.id, newCardId);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs border-none bg-transparent shadow-none px-1">
                    {(() => {
                      const card = cards.find(c => c.id === firstReq.bankCardId);
                      const cardColor = card ? getCardCssColor(card.color) : undefined;
                      return card ? (
                        <span className="flex items-center gap-1.5 truncate" style={cardColor ? { color: cardColor } : undefined}>
                          <CreditCard className="h-3 w-3 shrink-0" />
                          {card.name}
                        </span>
                      ) : <SelectValue placeholder="No card" />;
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No card</SelectItem>
                    {cards.map((c) => {
                      const cColor = getCardCssColor(c.color);
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3 shrink-0" style={cColor ? { color: cColor } : undefined} />
                            {c.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Status - inline select */}
              <div className="shrink-0 w-28" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={firstReq.status}
                  onValueChange={async (val) => {
                    const newStatus = val as RequestStatus;
                    for (const r of group.requests) {
                      await handleStatusChange(r.id, newStatus);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs border-none bg-transparent shadow-none px-1">
                    <span className="flex items-center gap-1.5">
                      {STATUS_CONFIG[firstReq.status]?.icon}
                      {STATUS_CONFIG[firstReq.status]?.label}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          {STATUS_CONFIG[s].icon}
                          {STATUS_CONFIG[s].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Need by date */}
              {firstReq.needByDate ? (
                <span className={`text-xs shrink-0 hidden sm:block w-24 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {format(new Date(firstReq.needByDate), "MMM d, yyyy")}
                </span>
              ) : (
                <span className="w-24 shrink-0 hidden sm:block" />
              )}

              {/* Total */}
              <span className="text-sm font-medium text-primary w-20 text-right shrink-0">
                {formatCurrency(groupTotal)}
              </span>
            </div>
          );
        })}
      </div>
    );
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
          const groupTotal = group.requests.reduce((s, r) => s + getRequestTotal(r), 0);
          const firstReq = group.requests[0];
          const isOwnGroup = linkedName && firstReq.requesterName === linkedName;
          const canManageGroup = isAdminUser || isOwnGroup;
          const isOverdue = firstReq.needByDate && new Date(firstReq.needByDate) < new Date() && firstReq.status !== 'received' && firstReq.status !== 'cancelled';


          return (
            <Card key={group.key} className="flex flex-col cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => {
                const navKey = firstReq.requestNumber || group.key;
                navigate(`/requests/view/${encodeURIComponent(navKey)}`);
              }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {firstReq.requestNumber && (
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {firstReq.requestNumber}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    {group.requests.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {group.requests.length} items
                      </Badge>
                    )}
                    {canManageGroup && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/requests/edit/${firstReq.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                {/* Requester name */}
                {firstReq.requesterName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <User className="h-3 w-3" />
                    <span>{firstReq.requesterName}</span>
                  </div>
                )}
                {/* Need by date */}
                {firstReq.needByDate && (
                  <div className="flex items-center gap-1 text-xs mt-1 text-destructive font-medium">
                    <CalendarClock className="h-3 w-3" />
                    <span>Need by: {format(new Date(firstReq.needByDate), "MMM d, yyyy")}</span>
                    {isOverdue && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">Overdue</Badge>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2 pt-0 flex-1 flex flex-col">
                {/* Item rows */}
                <div className="space-y-0">
                {group.requests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0 border-border/50">
                      <span className="truncate flex-1 mr-2">{r.itemName}</span>
                      <span className="text-muted-foreground whitespace-nowrap mr-3">×{r.quantity}</span>
                      <span className="font-medium whitespace-nowrap mr-1">{formatCurrency(getRequestTotal(r))}</span>
                      {canManageGroup && group.requests.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm(`Delete "${r.itemName}" from this request?`)) return;
                            await deleteRequest(r.id);
                          }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(groupTotal)}</span>
                  </div>
                </div>

                {/* PDF attachments display */}
                {group.requests.some(r => r.pdfUrl) && (
                  <div className="flex flex-wrap gap-1">
                    {group.requests.filter(r => r.pdfUrl).map(r => (
                      <a
                        key={r.id}
                        href={r.pdfUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          e.preventDefault();
                          await downloadFileFromUrl(
                            r.pdfUrl!,
                            getFileNameFromUrl(r.pdfUrl!, `${group.requestNumber || r.itemName || "request"}.pdf`)
                          );
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 border border-primary/20 rounded px-2 py-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{r.itemName}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* PDF Upload for first item (applies to group) */}
                <GroupPdfUpload
                  requests={group.requests}
                  uploadPdf={uploadPdf}
                />

                {/* Vendor selector — highly visible */}
                <div className="p-2 bg-accent/50 rounded-lg border border-accent space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Vendor</span>
                  </div>
                  {vendors.length > 0 && (
                    <Select
                      value={vendors.some(v => v.name === firstReq.vendorName) ? (firstReq.vendorName ?? "") : ""}
                      onValueChange={async (val) => {
                        for (const r of group.requests) {
                          await updateRequest(r.id, { vendorName: val || null });
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm font-medium">
                        <SelectValue placeholder={firstReq.vendorName || "Select vendor..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    placeholder="Or type custom vendor..."
                    className="h-8 text-sm"
                    defaultValue={vendors.some(v => v.name === firstReq.vendorName) ? "" : (firstReq.vendorName || "")}
                    onBlur={async (e) => {
                      const val = e.target.value.trim();
                      if (val) {
                        for (const r of group.requests) {
                          await updateRequest(r.id, { vendorName: val });
                        }
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          for (const r of group.requests) {
                            await updateRequest(r.id, { vendorName: val });
                          }
                        }
                      }
                    }}
                  />
                </div>

                {/* Card selector */}
                {cards.length > 0 && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {firstReq.bankCardId ? (
                      <div className={`h-4 w-4 rounded-full bg-gradient-to-br ${cards.find(c => c.id === firstReq.bankCardId)?.color ?? 'from-gray-600 to-gray-800'} shrink-0`} />
                    ) : (
                      <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <Select
                      value={firstReq.bankCardId ?? ""}
                      onValueChange={async (val) => {
                        const cardId = val || null;
                        for (const r of group.requests) {
                          await updateCardId(r.id, cardId);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm">
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

                {/* Status selector */}
                <div onClick={(e) => e.stopPropagation()}>
                  {isAdminUser && firstReq.status !== 'cancelled' ? (
                    <Select
                      value={firstReq.status}
                      onValueChange={async (value: RequestStatus) => {
                        if (value === 'approved') {
                          const allHaveCard = group.requests.every(r => r.bankCardId);
                          if (!allHaveCard) {
                            toast({ title: "Card required", description: "Assign a bank card before approving.", variant: "destructive" });
                            return;
                          }
                        }
                        for (const r of group.requests) {
                          await updateStatus(r.id, value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
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
                    <Badge variant="outline" className={`w-full justify-center py-2 ${
                      firstReq.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      firstReq.status === 'approved' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      firstReq.status === 'ordered' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                      firstReq.status === 'received' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {firstReq.status.charAt(0).toUpperCase() + firstReq.status.slice(1)}
                    </Badge>
                  )}
                </div>

                {/* Footer with delete */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(firstReq.createdAt), "MMM d, yyyy")}
                  </span>
                  <div className="flex items-center gap-1">
                    {canManageGroup && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Delete all ${group.requests.length} items in ${group.key}?`)) return;
                          for (const r of group.requests) {
                            await deleteRequest(r.id);
                          }
                        }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <Button
            variant={viewMode === 'lines' ? 'default' : 'ghost'}
            size="icon"
            className="rounded-none h-9 w-9"
            onClick={() => { setViewMode('lines'); localStorage.setItem('requestsViewMode', 'lines'); }}
            title="List view"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="icon"
            className="rounded-none h-9 w-9"
            onClick={() => { setViewMode('cards'); localStorage.setItem('requestsViewMode', 'cards'); }}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => navigate("/requests/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9" />
        </div>

        {uniqueVendors.length > 0 && (
          <Select value={filterVendor} onValueChange={setFilterVendor}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Vendors" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {uniqueVendors.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {uniqueRequesters.length > 1 && (
          <Select value={filterRequester} onValueChange={setFilterRequester}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Requesters" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requesters</SelectItem>
              {uniqueRequesters.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
            {viewMode === 'lines' ? renderRequestList(status) : renderRequestGrid(status)}
          </TabsContent>
        )}
      </Tabs>

    </div>);

}