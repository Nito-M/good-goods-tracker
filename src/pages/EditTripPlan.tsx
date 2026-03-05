import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTripPlans, CreateTripPlanInput } from "@/hooks/useTripPlans";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Plus, X, MapPin, ChevronLeft, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PurchaseOrder } from "@/types/purchaseOrder";

const COLOR_OPTIONS = [
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-emerald-500", label: "Green" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-rose-500", label: "Rose" },
  { value: "bg-amber-500", label: "Amber" },
];

function PoSearchPicker({
  purchaseOrders,
  selectedPoIds,
  onToggle,
  allSelectedPoIds,
}: {
  purchaseOrders: PurchaseOrder[];
  selectedPoIds: string[];
  onToggle: (poId: string) => void;
  allSelectedPoIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = purchaseOrders.filter(
    (po) =>
      query.trim().length > 0 &&
      ((po.poNumber || "").toLowerCase().includes(query.toLowerCase()) ||
        (po.vendorName || "").toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Plus className="h-4 w-4 mr-1" /> Add PO
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search POs..." value={query} onValueChange={setQuery} />
          <CommandList>
            {query.trim().length > 0 ? (
              <>
                <CommandEmpty>No POs found.</CommandEmpty>
                <CommandGroup>
                  {filtered.map((po) => (
                    <CommandItem
                      key={po.id}
                      onSelect={() => { onToggle(po.id); setOpen(false); setQuery(""); }}
                    >
                      <span className="font-medium text-sm">
                        {po.poNumber || "PO"}{po.vendorName ? ` — ${po.vendorName}` : ""}
                      </span>
                      {(selectedPoIds.includes(po.id) || allSelectedPoIds?.includes(po.id)) && (
                        <Badge variant="outline" className="ml-auto text-xs">Added</Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">Type to search POs...</div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function EditTripPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tripPlans, loading, updateTripPlan } = useTripPlans();
  const { orders: purchaseOrders } = usePurchaseOrders();

  const trip = tripPlans.find((t) => t.id === id);

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("bg-teal-500");
  const [locations, setLocations] = useState<{ name: string; address: string }[]>([]);
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]); // trip-level POs
  const [locationPoMap, setLocationPoMap] = useState<Record<number, string[]>>({}); // idx -> poIds
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (trip && !initialized) {
      setTitle(trip.title);
      setStartDate(parseISO(trip.startDate));
      setEndDate(trip.endDate ? parseISO(trip.endDate) : undefined);
      setNotes(trip.notes || "");
      setColor(trip.color);
      setLocations(trip.locations.map((l) => ({ name: l.name, address: l.address || "" })));
      // Trip-level POs
      setSelectedPoIds(trip.pos.filter((p) => p.locationIndex === null).map((p) => p.purchaseOrderId));
      // Location-level POs
      const locMap: Record<number, string[]> = {};
      trip.pos.filter((p) => p.locationIndex !== null).forEach((p) => {
        const idx = p.locationIndex!;
        if (!locMap[idx]) locMap[idx] = [];
        locMap[idx].push(p.purchaseOrderId);
      });
      setLocationPoMap(locMap);
      setInitialized(true);
    }
  }, [trip, initialized]);

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

  const handleAddLocation = () => {
    if (!locName.trim()) return;
    setLocations([...locations, { name: locName.trim(), address: locAddress.trim() }]);
    setLocName("");
    setLocAddress("");
  };

  const handleRemoveLocation = (idx: number) => {
    setLocations(locations.filter((_, i) => i !== idx));
    // Re-index locationPoMap
    const newMap: Record<number, string[]> = {};
    Object.entries(locationPoMap).forEach(([key, val]) => {
      const k = parseInt(key);
      if (k < idx) newMap[k] = val;
      else if (k > idx) newMap[k - 1] = val;
    });
    setLocationPoMap(newMap);
  };

  const handleMoveLocation = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= locations.length) return;
    const newLocs = [...locations];
    [newLocs[idx], newLocs[targetIdx]] = [newLocs[targetIdx], newLocs[idx]];
    setLocations(newLocs);
    // Swap PO assignments
    const newMap: Record<number, string[]> = { ...locationPoMap };
    const aPos = newMap[idx];
    const bPos = newMap[targetIdx];
    delete newMap[idx];
    delete newMap[targetIdx];
    if (aPos?.length) newMap[targetIdx] = aPos;
    if (bPos?.length) newMap[idx] = bPos;
    setLocationPoMap(newMap);
  };

  const toggleTripPo = (poId: string) => {
    setSelectedPoIds((prev) =>
      prev.includes(poId) ? prev.filter((id) => id !== poId) : [...prev, poId]
    );
  };

  const toggleLocationPo = (locIdx: number, poId: string) => {
    setLocationPoMap((prev) => {
      const existing = prev[locIdx] || [];
      if (existing.includes(poId)) {
        const updated = existing.filter((id) => id !== poId);
        const newMap = { ...prev };
        if (updated.length === 0) delete newMap[locIdx];
        else newMap[locIdx] = updated;
        return newMap;
      }
      return { ...prev, [locIdx]: [...existing, poId] };
    });
  };

  const handleSave = async () => {
    if (!title.trim() || !startDate) return;
    setSaving(true);
    await updateTripPlan(trip.id, {
      title: title.trim(),
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      notes: notes.trim() || undefined,
      color,
      locations,
      poIds: selectedPoIds,
      locationPoMap,
    });
    setSaving(false);
    navigate(`/calendar/trip/${trip.id}`);
  };

  // Collect all PO IDs that are already assigned anywhere
  const allAssignedPoIds = [
    ...selectedPoIds,
    ...Object.values(locationPoMap).flat(),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/calendar/trip/${trip.id}`)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Trip Plan</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/calendar/trip/${trip.id}`)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || !startDate || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-trip-title">Trip Title</Label>
                <Input
                  id="edit-trip-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pickup run downtown"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-7 h-7 rounded-full ${c.value} ${
                        color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-trip-notes">Notes (optional)</Label>
                <Textarea
                  id="edit-trip-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Trip details..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Trip-level POs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">General Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPoIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPoIds.map((poId) => {
                    const po = purchaseOrders.find((p) => p.id === poId);
                    return (
                      <Badge key={poId} variant="secondary" className="gap-1 py-1">
                        {po?.poNumber || "PO"}
                        {po?.vendorName && ` — ${po.vendorName}`}
                        <button onClick={() => toggleTripPo(poId)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <PoSearchPicker
                purchaseOrders={purchaseOrders}
                selectedPoIds={selectedPoIds}
                onToggle={toggleTripPo}
                allSelectedPoIds={allAssignedPoIds}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column - Locations */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Locations / Stops</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locations.length > 0 && (
                <div className="space-y-3">
                  {locations.map((loc, idx) => {
                    const locPoIds = locationPoMap[idx] || [];
                    return (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">{loc.name}</span>
                          {loc.address && <span className="text-muted-foreground truncate">— {loc.address}</span>}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleMoveLocation(idx, "up")}
                              disabled={idx === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleMoveLocation(idx, "down")}
                              disabled={idx === locations.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleRemoveLocation(idx)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* POs for this location */}
                        {locPoIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-5">
                            {locPoIds.map((poId) => {
                              const po = purchaseOrders.find((p) => p.id === poId);
                              return (
                                <Badge key={poId} variant="outline" className="gap-1 text-xs">
                                  {po?.poNumber || "PO"}
                                  {po?.vendorName && ` — ${po.vendorName}`}
                                  <button onClick={() => toggleLocationPo(idx, poId)}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        <div className="pl-5">
                          <PoSearchPicker
                            purchaseOrders={purchaseOrders}
                            selectedPoIds={locPoIds}
                            onToggle={(poId) => toggleLocationPo(idx, poId)}
                            allSelectedPoIds={allAssignedPoIds}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="Location name"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLocation())}
                />
                <Input
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder="Address (optional)"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLocation())}
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAddLocation} disabled={!locName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
