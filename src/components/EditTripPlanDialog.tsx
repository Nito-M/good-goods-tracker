import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TripPlan, CreateTripPlanInput } from "@/hooks/useTripPlans";
import { PurchaseOrder } from "@/types/purchaseOrder";
import { format, parseISO } from "date-fns";
import { Plus, X, MapPin } from "lucide-react";
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

const COLOR_OPTIONS = [
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-emerald-500", label: "Green" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-rose-500", label: "Rose" },
  { value: "bg-amber-500", label: "Amber" },
];

interface EditTripPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, input: CreateTripPlanInput) => Promise<void>;
  purchaseOrders: PurchaseOrder[];
  tripPlan: TripPlan | null;
}

export function EditTripPlanDialog({
  open,
  onOpenChange,
  onSave,
  purchaseOrders,
  tripPlan,
}: EditTripPlanDialogProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("bg-teal-500");
  const [locations, setLocations] = useState<{ name: string; address: string; notes: string }[]>([]);
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locNotes, setLocNotes] = useState("");
  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]);
  const [poSearchQuery, setPoSearchQuery] = useState("");
  const [poPickerOpen, setPoPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tripPlan && open) {
      setTitle(tripPlan.title);
      setStartDate(parseISO(tripPlan.startDate));
      setEndDate(tripPlan.endDate ? parseISO(tripPlan.endDate) : undefined);
      setNotes(tripPlan.notes || "");
      setColor(tripPlan.color);
      setLocations(
        tripPlan.locations.map((l) => ({ name: l.name, address: l.address || "" }))
      );
      setSelectedPoIds(tripPlan.pos.map((p) => p.purchaseOrderId));
      setLocName("");
      setLocAddress("");
      setPoSearchQuery("");
    }
  }, [tripPlan, open]);

  const handleAddLocation = () => {
    if (!locName.trim()) return;
    setLocations([...locations, { name: locName.trim(), address: locAddress.trim() }]);
    setLocName("");
    setLocAddress("");
  };

  const handleRemoveLocation = (idx: number) => {
    setLocations(locations.filter((_, i) => i !== idx));
  };

  const togglePo = (poId: string) => {
    setSelectedPoIds((prev) =>
      prev.includes(poId) ? prev.filter((id) => id !== poId) : [...prev, poId]
    );
  };

  const handleSave = async () => {
    if (!title.trim() || !startDate || !tripPlan) return;
    setSaving(true);
    await onSave(tripPlan.id, {
      title: title.trim(),
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      notes: notes.trim() || undefined,
      color,
      locations,
      poIds: selectedPoIds,
    });
    setSaving(false);
    onOpenChange(false);
  };

  const filteredPos = purchaseOrders.filter(
    (po) =>
      poSearchQuery.trim().length > 0 &&
      ((po.poNumber || "").toLowerCase().includes(poSearchQuery.toLowerCase()) ||
        (po.vendorName || "").toLowerCase().includes(poSearchQuery.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label>Locations / Stops</Label>
            {locations.length > 0 && (
              <div className="space-y-1 mt-1 mb-2">
                {locations.map((loc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm border rounded-md px-2 py-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{loc.name}</span>
                    {loc.address && <span className="text-muted-foreground truncate">— {loc.address}</span>}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 ml-auto shrink-0"
                      onClick={() => handleRemoveLocation(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
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
          </div>

          <div>
            <Label>Link Purchase Orders</Label>
            {selectedPoIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 mb-2">
                {selectedPoIds.map((poId) => {
                  const po = purchaseOrders.find((p) => p.id === poId);
                  return (
                    <Badge key={poId} variant="secondary" className="gap-1">
                      {po?.poNumber || "PO"}
                      {po?.vendorName && ` — ${po.vendorName}`}
                      <button onClick={() => togglePo(poId)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <Popover open={poPickerOpen} onOpenChange={(o) => { setPoPickerOpen(o); if (!o) setPoSearchQuery(""); }}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-1" /> Add PO
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search POs..." value={poSearchQuery} onValueChange={setPoSearchQuery} />
                  <CommandList>
                    {poSearchQuery.trim().length > 0 ? (
                      <>
                        <CommandEmpty>No POs found.</CommandEmpty>
                        <CommandGroup>
                          {filteredPos.map((po) => (
                            <CommandItem
                              key={po.id}
                              onSelect={() => { togglePo(po.id); setPoPickerOpen(false); setPoSearchQuery(""); }}
                            >
                              <span className="font-medium text-sm">
                                {po.poNumber || "PO"}{po.vendorName ? ` — ${po.vendorName}` : ""}
                              </span>
                              {selectedPoIds.includes(po.id) && <Badge variant="outline" className="ml-auto text-xs">Added</Badge>}
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
          </div>

          <div>
            <Label htmlFor="edit-trip-notes">Notes (optional)</Label>
            <Textarea
              id="edit-trip-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Trip details..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || !startDate || saving}>
            {saving ? "Saving..." : "Update Trip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
