import { useParams, useNavigate, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useTripPlans } from "@/hooks/useTripPlans";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useBankCards } from "@/hooks/useBankCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { PurchaseOrder } from "@/types/purchaseOrder";
import {
  ChevronLeft,
  MapPin,
  MapPinned,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  CalendarDays,
  StickyNote,
  CreditCard,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function getPoTotal(po: PurchaseOrder) {
  const subtotal = po.items.reduce((sum, item) => sum + item.quantity * (item.unitCost || 0), 0);
  const discount = po.discountAmount || 0;
  return (subtotal - discount) * 1.05;
}

function PoBadgeLink({
  poNumber,
  vendorName,
  poId,
  total,
  isPaid,
}: {
  poNumber?: string | null;
  vendorName?: string | null;
  poId: string;
  total?: number;
  isPaid?: boolean;
}) {
  return (
    <Link to={`/purchase-orders${poNumber ? `?po=${encodeURIComponent(poNumber)}` : ''}`} className="inline-block">
      <Badge variant="outline" className="text-xs py-1 px-2 cursor-pointer hover:bg-accent transition-colors gap-1.5">
        <span className="font-medium">{poNumber || "PO"}</span>
        {vendorName && <span className="text-muted-foreground">— {vendorName}</span>}
        {total !== undefined && <span className="font-semibold">{formatCurrency(total)}</span>}
        {isPaid && (
          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </span>
        )}
        <ExternalLink className="h-3 w-3" />
      </Badge>
    </Link>
  );
}

export function TripPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tripPlans, loading, deleteTripPlan, addLocationToTripPlan } = useTripPlans();
  const { orders: purchaseOrders } = usePurchaseOrders();
  const { cards: bankCards } = useBankCards();
  const { toast } = useToast();

  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [newLocNotes, setNewLocNotes] = useState("");
  const [addingLoc, setAddingLoc] = useState(false);

  const trip = tripPlans.find((t) => t.id === id);

  // Build a lookup of PO details for all trip POs
  const poLookup = useMemo(() => {
    if (!trip) return new Map<string, PurchaseOrder>();
    const map = new Map<string, PurchaseOrder>();
    for (const tp of trip.pos) {
      const po = purchaseOrders.find((p) => p.id === tp.purchaseOrderId);
      if (po) map.set(po.id, po);
    }
    return map;
  }, [trip, purchaseOrders]);

  // Summary grouped by bank card
  const cardSummary = useMemo(() => {
    if (!trip) return [];
    const groups: Record<string, { cardName: string; total: number; paid: number; unpaid: number; count: number }> = {};
    for (const tp of trip.pos) {
      const po = poLookup.get(tp.purchaseOrderId);
      if (!po) continue;
      const total = getPoTotal(po);
      const cardKey = po.bankCardId || "__none__";
      if (!groups[cardKey]) {
        const card = bankCards.find((c) => c.id === po.bankCardId);
        groups[cardKey] = { cardName: card?.name || "No Card", total: 0, paid: 0, unpaid: 0, count: 0 };
      }
      groups[cardKey].total += total;
      groups[cardKey].count += 1;
      if (po.paidAt) groups[cardKey].paid += total;
      else groups[cardKey].unpaid += total;
    }
    return Object.entries(groups).map(([key, val]) => ({ cardId: key, ...val }));
  }, [trip, poLookup, bankCards]);

  const grandTotal = cardSummary.reduce((s, g) => s + g.total, 0);
  const grandPaid = cardSummary.reduce((s, g) => s + g.paid, 0);
  const grandUnpaid = cardSummary.reduce((s, g) => s + g.unpaid, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/calendar")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Calendar
        </Button>
        <p className="text-muted-foreground">Trip plan not found.</p>
      </div>
    );
  }

  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getGoogleMapsUrl = (loc: { name: string; address: string | null }) => {
    const query = loc.address || loc.name;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleDelete = async () => {
    await deleteTripPlan(trip.id);
    navigate("/calendar");
  };

  const tripLevelPos = trip.pos.filter((po) => po.locationIndex === null);
  const getPosForLocation = (idx: number) => trip.pos.filter((po) => po.locationIndex === idx);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/calendar")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={cn("w-4 h-4 rounded-full shrink-0", trip.color)} />
            <h1 className="text-2xl font-bold tracking-tight">{trip.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/calendar/trip/${trip.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete trip plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{trip.title}" and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Date info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {trip.startDate}
              {trip.endDate && ` → ${trip.endDate}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {trip.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="h-4 w-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{trip.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Locations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPinned className="h-4 w-4" /> Locations / Stops
            {trip.locations.length > 0 && (
              <Badge variant="secondary" className="text-xs">{trip.locations.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trip.locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations added.</p>
          ) : (
            <div className="space-y-2">
              {trip.locations.map((loc, idx) => {
                const locPos = getPosForLocation(idx);
                return (
                  <div
                    key={loc.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{loc.name}</p>
                        {loc.address && (
                          <p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p>
                        )}
                        {loc.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 italic">{loc.notes}</p>
                        )}
                        {locPos.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {locPos.map((tp) => {
                              const po = poLookup.get(tp.purchaseOrderId);
                              return (
                                <PoBadgeLink
                                  key={tp.id}
                                  poId={tp.purchaseOrderId}
                                  poNumber={tp.poNumber}
                                  vendorName={tp.vendorName}
                                  total={po ? getPoTotal(po) : undefined}
                                  isPaid={!!po?.paidAt}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Copy address"
                          onClick={() => handleCopyAddress(loc.address || loc.name)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Open in Google Maps"
                          asChild
                        >
                          <a
                            href={getGoogleMapsUrl(loc)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Location inline form */}
          <div className="space-y-2 pt-2 border-t mt-3">
            <div className="flex gap-2">
              <Input
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                placeholder="Location name"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
              />
              <Input
                value={newLocAddress}
                onChange={(e) => setNewLocAddress(e.target.value)}
                placeholder="Address (optional)"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleAddLocation}
                disabled={!newLocName.trim() || addingLoc}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={newLocNotes}
              onChange={(e) => setNewLocNotes(e.target.value)}
              placeholder="Notes for this stop (optional)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLocation();
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trip-level POs */}
      {tripLevelPos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">General Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tripLevelPos.map((tp) => {
                const po = poLookup.get(tp.purchaseOrderId);
                return (
                  <PoBadgeLink
                    key={tp.id}
                    poId={tp.purchaseOrderId}
                    poNumber={tp.poNumber}
                    vendorName={tp.vendorName}
                    total={po ? getPoTotal(po) : undefined}
                    isPaid={!!po?.paidAt}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary by Card */}
      {cardSummary.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Trip Cost Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cardSummary.map((group) => (
              <div key={group.cardId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{group.cardName}</span>
                  <Badge variant="secondary" className="text-xs">{group.count} PO{group.count !== 1 ? "s" : ""}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {group.paid > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {formatCurrency(group.paid)} paid
                    </span>
                  )}
                  {group.unpaid > 0 && (
                    <span className="text-muted-foreground">
                      {formatCurrency(group.unpaid)} unpaid
                    </span>
                  )}
                  <span className="font-semibold">{formatCurrency(group.total)}</span>
                </div>
              </div>
            ))}

            {/* Grand total */}
            {cardSummary.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-semibold">Grand Total</span>
                <div className="flex items-center gap-4 text-sm">
                  {grandPaid > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(grandPaid)} paid
                    </span>
                  )}
                  {grandUnpaid > 0 && (
                    <span className="text-muted-foreground">
                      {formatCurrency(grandUnpaid)} unpaid
                    </span>
                  )}
                  <span className="font-bold">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
