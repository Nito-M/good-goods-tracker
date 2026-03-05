import { useParams, useNavigate, Link } from "react-router-dom";
import { useTripPlans } from "@/hooks/useTripPlans";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  MapPinned,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  CalendarDays,
  StickyNote,
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

function PoBadgeLink({ poNumber, vendorName, poId }: { poNumber?: string | null; vendorName?: string | null; poId: string }) {
  return (
    <Link to={`/purchase-orders${poNumber ? `?po=${encodeURIComponent(poNumber)}` : ''}`} className="inline-block">
      <Badge variant="outline" className="text-xs py-1 px-2 cursor-pointer hover:bg-accent transition-colors">
        {poNumber || "PO"}
        {vendorName ? ` — ${vendorName}` : ""}
        <ExternalLink className="h-3 w-3 ml-1" />
      </Badge>
    </Link>
  );
}

export function TripPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tripPlans, loading, deleteTripPlan } = useTripPlans();
  const { toast } = useToast();

  const trip = tripPlans.find((t) => t.id === id);

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

  // Separate trip-level POs from location-level POs
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
                        {locPos.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {locPos.map((po) => (
                              <PoBadgeLink key={po.id} poId={po.purchaseOrderId} poNumber={po.poNumber} vendorName={po.vendorName} />
                            ))}
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
              {tripLevelPos.map((po) => (
                <PoBadgeLink key={po.id} poId={po.purchaseOrderId} poNumber={po.poNumber} vendorName={po.vendorName} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
