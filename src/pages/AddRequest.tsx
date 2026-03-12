import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests } from "@/hooks/useRequests";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { useLinkedRequester } from "@/hooks/useLinkedRequester";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, X, Link as LinkIcon, CalendarIcon, User, Check, ChevronsUpDown, FileText, ArrowLeft, Trash2, ChevronDown, ChevronsDownUp } from "lucide-react";
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { CreateRequestInput } from "@/types/request";
import { InventoryItem } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";

interface RequestLineItem {
  id: string;
  selectedItemId: string;
  itemName: string;
  sku: string;
  quantity: number | "";
  quantityUnit: string;
  price: number | "";
  gstRate: number | "";
  extraCost: number | "";
  extraCostLabel: string;
  link: string;
  notes: string;
  needByDate: Date | undefined;
  imageFile: File | null;
  imagePreview: string | null;
  pdfFile: File | null;
  pdfDragOver: boolean;
}

function createEmptyLine(): RequestLineItem {
  return {
    id: crypto.randomUUID(),
    selectedItemId: "",
    itemName: "",
    sku: "",
    quantity: "",
    quantityUnit: "pcs",
    price: "",
    gstRate: 5,
    extraCost: 0,
    extraCostLabel: "Shipping",
    link: "",
    notes: "",
    needByDate: undefined,
    imageFile: null,
    imagePreview: null,
    pdfFile: null,
    pdfDragOver: false,
  };
}

function RequestItemForm({
  line,
  index,
  items,
  onChange,
  onRemove,
  canRemove,
  isOpen,
  onToggle,
}: {
  line: RequestLineItem;
  index: number;
  items: InventoryItem[];
  onChange: (id: string, updates: Partial<RequestLineItem>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [itemSearchOpen, setItemSearchOpen] = useState(false);

  const handleItemSelect = (value: string) => {
    if (value === "custom") {
      onChange(line.id, { selectedItemId: "custom", itemName: "", sku: "", quantityUnit: "pcs" });
    } else {
      const item = items.find((i) => i.id === value);
      if (item) {
        onChange(line.id, {
          selectedItemId: value,
          itemName: item.name,
          sku: item.sku,
          quantityUnit: item.quantityUnit || "pcs",
          price: item.cost > 0 ? item.cost : item.price,
        });
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onChange(line.id, { imageFile: file, imagePreview: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === "application/pdf") onChange(line.id, { pdfFile: file });
  };

  const handlePdfDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onChange(line.id, { pdfDragOver: false });
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") onChange(line.id, { pdfFile: file });
  }, [line.id, onChange]);

  const qtyVal = typeof line.quantity === "number" ? line.quantity : 0;
  const unitPriceVal = typeof line.price === "number" ? line.price : 0;
  const gst = typeof line.gstRate === "number" ? line.gstRate : 0;
  const extra = typeof line.extraCost === "number" ? line.extraCost : 0;

  const summary = line.itemName || "Untitled item";
  const qty = typeof line.quantity === "number" ? line.quantity : 0;
  const unitPrice = typeof line.price === "number" ? line.price : 0;
  const totalLine = unitPrice > 0 ? ` — ${formatCurrency((qty || 1) * unitPrice)}` : "";

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button type="button" className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                <CardTitle className="text-base">
                  Item {index + 1}
                  {!isOpen && <span className="ml-2 font-normal text-sm text-muted-foreground">{summary}{totalLine}</span>}
                </CardTitle>
              </button>
            </CollapsibleTrigger>
            {canRemove && (
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(line.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
        {/* Item Selection */}
        <div className="space-y-2">
          <Label>Item</Label>
          <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                <span className="truncate">
                  {line.selectedItemId === "custom"
                    ? "Custom Item"
                    : line.selectedItemId
                    ? items.find((i) => i.id === line.selectedItemId)?.name + " (" + items.find((i) => i.id === line.selectedItemId)?.sku + ")"
                    : "Select an item or create custom"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" align="start">
              <Command>
                <CommandInput placeholder="Search items..." />
                <CommandList className="max-h-[min(50vh,20rem)] overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                  <CommandEmpty>No items found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="custom" onSelect={() => { handleItemSelect("custom"); setItemSearchOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", line.selectedItemId === "custom" ? "opacity-100" : "opacity-0")} />
                      Custom Item
                    </CommandItem>
                    {items.map((item) => (
                      <CommandItem key={item.id} value={`${item.name} ${item.sku}`} onSelect={() => { handleItemSelect(item.id); setItemSearchOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", line.selectedItemId === item.id ? "opacity-100" : "opacity-0")} />
                        <span>{item.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({item.sku})</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Item Name & SKU */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Item Name *</Label>
            <Input value={line.itemName} onChange={(e) => onChange(line.id, { itemName: e.target.value })} placeholder="Enter item name" required />
          </div>
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input value={line.sku} onChange={(e) => onChange(line.id, { sku: e.target.value })} placeholder="Enter SKU" />
          </div>
        </div>

        {/* Quantity, Unit, Price, GST */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input type="number" min={0.01} step="0.01" value={line.quantity} onChange={(e) => onChange(line.id, { quantity: e.target.value ? parseFloat(e.target.value) : "" })} placeholder="1" />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={line.quantityUnit} onValueChange={(v) => onChange(line.id, { quantityUnit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["pcs", "kg", "lb", "m", "ft", "box", "pack"].map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Unit Price ($)</Label>
            <Input type="number" min={0} step={0.00001} value={line.price} onChange={(e) => onChange(line.id, { price: e.target.value ? parseFloat(e.target.value) : 0 })} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label>GST (%)</Label>
            <Input type="number" min={0} max={100} step={0.1} value={line.gstRate} onChange={(e) => onChange(line.id, { gstRate: e.target.value ? parseFloat(e.target.value) : 0 })} placeholder="0" />
          </div>
        </div>

        {/* Extra Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Extra Cost Label</Label>
            <Input value={line.extraCostLabel} onChange={(e) => onChange(line.id, { extraCostLabel: e.target.value })} placeholder="e.g. Shipping" />
          </div>
          <div className="space-y-2">
            <Label>Extra Cost ($)</Label>
            <Input type="number" min={0} step={0.01} value={line.extraCost} onChange={(e) => onChange(line.id, { extraCost: e.target.value ? parseFloat(e.target.value) : 0 })} placeholder="0.00" />
          </div>
        </div>

        {/* Price Breakdown */}
        {unitPriceVal > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({qtyVal || 1} × {formatCurrency(unitPriceVal)})</span>
              <span className="font-medium">{formatCurrency((qtyVal || 1) * unitPriceVal)}</span>
            </div>
            {gst > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({gst}%)</span>
                <span className="font-medium">{formatCurrency(((qtyVal || 1) * unitPriceVal) * (gst / 100))}</span>
              </div>
            )}
            {extra > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{line.extraCostLabel || "Extra Cost"}</span>
                <span className="font-medium">{formatCurrency(extra)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary">{formatCurrency(((qtyVal || 1) * unitPriceVal) * (1 + gst / 100) + extra)}</span>
            </div>
          </div>
        )}

        {/* Need By Date & Link */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Need By Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !line.needByDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {line.needByDate ? format(line.needByDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={line.needByDate} onSelect={(d) => onChange(line.id, { needByDate: d })} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Link</Label>
            <Input type="url" value={line.link} onChange={(e) => onChange(line.id, { link: e.target.value })} placeholder="https://example.com/product" />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea value={line.notes} onChange={(e) => onChange(line.id, { notes: e.target.value })} placeholder="Add any notes or specifications..." rows={2} />
        </div>

        {/* Image & PDF side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Image</Label>
            {line.imagePreview ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                <img src={line.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => onChange(line.id, { imageFile: null, imagePreview: null })}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Upload image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> PDF</Label>
            {line.pdfFile ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50 h-32">
                <FileText className="h-6 w-6 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{line.pdfFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(line.pdfFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange(line.id, { pdfFile: null })}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handlePdfDrop}
              >
                <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Upload PDF</span>
                <input type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function AddRequest() {
  const navigate = useNavigate();
  const { addRequest, uploadImage, uploadPdf } = useRequests();
  const { allItems } = useInventory();
  const { profile } = useProfile();
  const { linkedName, allOrgRequesterNames, isAdminUser } = useLinkedRequester();
  const { toast } = useToast();

  const visibleRequesterNames = isAdminUser
    ? allOrgRequesterNames.length > 0 ? allOrgRequesterNames : profile?.requesterNames || []
    : linkedName ? [linkedName] : [];

  const [selectedRequester, setSelectedRequester] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [lines, setLines] = useState<RequestLineItem[]>([createEmptyLine()]);
  const [requestMode, setRequestMode] = useState<"multiple" | "single">("multiple");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set([lines[0]?.id]));
  const [loading, setLoading] = useState(false);

  const toggleItem = useCallback((id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = () => setOpenItems(new Set());

  const updateLine = useCallback((id: string, updates: Partial<RequestLineItem>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const addLine = () => {
    const newLine = createEmptyLine();
    setLines((prev) => [...prev, newLine]);
    // Collapse all existing, open only the new one
    setOpenItems(new Set([newLine.id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequester) {
      toast({ title: "Requester required", description: "Please select a requester.", variant: "destructive" });
      return;
    }

    const validLines = lines.filter((l) => l.itemName.trim());
    if (validLines.length === 0) {
      toast({ title: "No items", description: "Please add at least one item.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let sharedRequestNumber: string | null = null;

      for (const line of validLines) {
        let uploadedImageUrl: string | null = null;
        if (line.imageFile) uploadedImageUrl = await uploadImage(line.imageFile);

        let uploadedPdfUrl: string | null = null;
        if (line.pdfFile) uploadedPdfUrl = await uploadPdf(line.pdfFile);

        const qty = typeof line.quantity === "number" ? line.quantity : 1;
        const unitPrice = typeof line.price === "number" ? line.price : 0;
        const gst = typeof line.gstRate === "number" ? line.gstRate : 0;
        const extra = typeof line.extraCost === "number" ? line.extraCost : 0;

        const result = await addRequest({
          title: requestTitle.trim() || null,
          inventoryItemId: line.selectedItemId && line.selectedItemId !== "custom" ? line.selectedItemId : null,
          itemName: line.itemName.trim(),
          sku: line.sku.trim() || null,
          quantity: qty,
          quantityUnit: line.quantityUnit,
          price: unitPrice,
          gstRate: gst,
          extraCost: extra,
          extraCostLabel: line.extraCostLabel.trim() || "Shipping",
          link: line.link.trim() || null,
          notes: line.notes.trim() || null,
          imageUrl: uploadedImageUrl,
          pdfUrl: uploadedPdfUrl,
          needByDate: line.needByDate ? line.needByDate.toISOString() : null,
          requesterName: selectedRequester,
          // In single mode, reuse the first item's request number for all subsequent items
          requestNumber: requestMode === "single" ? sharedRequestNumber : null,
        });

        // Capture the first request's number for single-request mode
        if (requestMode === "single" && !sharedRequestNumber && result) {
          sharedRequestNumber = result.requestNumber;
        }
      }

      const desc = requestMode === "single"
        ? `Request ${sharedRequestNumber || ''} created with ${validLines.length} item(s)`
        : `${validLines.length} request(s) created successfully`;
      toast({ title: "Success", description: desc });
      navigate("/requests");
    } catch {
      toast({ title: "Error", description: "Failed to create requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/requests")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Request</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Requester */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Requester *
              </Label>
              {visibleRequesterNames.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                  No requesters configured. Please add requesters in Settings first.
                </p>
              ) : (
                <Select value={selectedRequester} onValueChange={setSelectedRequester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who is making this request" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleRequesterNames.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Request Title (Optional) */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="requestTitle">Request Title <span className="text-muted-foreground font-normal text-xs">(optional — defaults to item name)</span></Label>
              <Input id="requestTitle" value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} placeholder="e.g. Office supplies restock" />
            </div>
          </CardContent>
        </Card>

        {/* Collapse All button */}
        {lines.length > 1 && (
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={collapseAll} className="text-muted-foreground">
              <ChevronsDownUp className="h-4 w-4 mr-1" />
              Collapse All
            </Button>
          </div>
        )}

        {/* Line Items */}
        {lines.map((line, idx) => (
          <RequestItemForm
            key={line.id}
            line={line}
            index={idx}
            items={allItems}
            onChange={updateLine}
            onRemove={removeLine}
            canRemove={lines.length > 1}
            isOpen={openItems.has(line.id)}
            onToggle={() => toggleItem(line.id)}
          />
        ))}

        {/* Add another item */}
        <Button type="button" variant="outline" className="w-full" onClick={addLine}>
          <Plus className="h-4 w-4 mr-2" />
          Add Another Item
        </Button>

        {/* Request Mode */}
        {lines.length > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Request Mode</Label>
                <RadioGroup value={requestMode} onValueChange={(v) => setRequestMode(v as "multiple" | "single")} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="multiple" id="mode-multiple" />
                    <Label htmlFor="mode-multiple" className="font-normal cursor-pointer">
                      <span className="font-medium">Separate requests</span>
                      <span className="text-muted-foreground text-xs ml-1">— each item gets its own REQ #</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="single" id="mode-single" />
                    <Label htmlFor="mode-single" className="font-normal cursor-pointer">
                      <span className="font-medium">Single request</span>
                      <span className="text-muted-foreground text-xs ml-1">— all items share one REQ #</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/requests")} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Submitting..."
              : lines.length > 1
                ? requestMode === "single"
                  ? `Submit 1 Request (${lines.length} items)`
                  : `Submit ${lines.length} Requests`
                : "Submit Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
