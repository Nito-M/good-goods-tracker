import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Upload, X, Link as LinkIcon, CalendarIcon, Check, ChevronsUpDown, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { InventoryItem } from "@/types/inventory";
import { CreateRequestInput } from "@/types/request";

interface AddItemToRequestDialogProps {
  items: InventoryItem[];
  requestNumber: string;
  requesterName: string | null;
  onSave: (request: CreateRequestInput) => Promise<any>;
  onUploadImage: (file: File) => Promise<string | null>;
  onUploadPdf: (file: File) => Promise<string | null>;
}

export function AddItemToRequestDialog({ items, requestNumber, requesterName, onSave, onUploadImage, onUploadPdf }: AddItemToRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [quantityUnit, setQuantityUnit] = useState("pcs");
  const [price, setPrice] = useState<number | "">(0);
  const [gstRate, setGstRate] = useState<number | "">(5);
  const [extraCost, setExtraCost] = useState<number | "">(0);
  const [extraCostLabel, setExtraCostLabel] = useState("Shipping");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [needByDate, setNeedByDate] = useState<Date | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDragOver, setPdfDragOver] = useState(false);
  const [itemSearchOpen, setItemSearchOpen] = useState(false);

  const qty = typeof quantity === "number" ? quantity : 0;
  const unitPrice = typeof price === "number" ? price : 0;
  const gst = typeof gstRate === "number" ? gstRate : 0;
  const extra = typeof extraCost === "number" ? extraCost : 0;
  const subtotal = qty * unitPrice;
  const gstAmount = subtotal * (gst / 100);

  const handleItemSelect = (value: string) => {
    setSelectedItemId(value);
    if (value === "custom") {
      setItemName("");
      setSku("");
      setQuantityUnit("pcs");
    } else {
      const item = items.find((i) => i.id === value);
      if (item) {
        setItemName(item.name);
        setSku(item.sku);
        setQuantityUnit(item.quantityUnit || "pcs");
        if (item.cost > 0) setPrice(item.cost);
        else if (item.price > 0) setPrice(item.price);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePdfDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPdfDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === "application/pdf") setPdfFile(file);
  }, []);

  const resetForm = () => {
    setSelectedItemId("");
    setItemName("");
    setSku("");
    setQuantity(1);
    setQuantityUnit("pcs");
    setPrice(0);
    setGstRate(5);
    setExtraCost(0);
    setExtraCostLabel("Shipping");
    setLink("");
    setNotes("");
    setNeedByDate(undefined);
    setImageFile(null);
    setImagePreview(null);
    setPdfFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setLoading(true);
    try {
      let uploadedImageUrl: string | null = null;
      if (imageFile) uploadedImageUrl = await onUploadImage(imageFile);

      let uploadedPdfUrl: string | null = null;
      if (pdfFile) uploadedPdfUrl = await onUploadPdf(pdfFile);

      await onSave({
        inventoryItemId: selectedItemId && selectedItemId !== "custom" ? selectedItemId : null,
        itemName: itemName.trim(),
        sku: sku.trim() || null,
        quantity: qty || 1,
        quantityUnit,
        price: unitPrice,
        gstRate: gst,
        extraCost: extra,
        extraCostLabel: extraCostLabel.trim() || "Shipping",
        link: link.trim() || null,
        notes: notes.trim() || null,
        imageUrl: uploadedImageUrl,
        pdfUrl: uploadedPdfUrl,
        needByDate: needByDate ? needByDate.toISOString() : null,
        requesterName,
        requestNumber,
      });

      resetForm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Item to {requestNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selection */}
          <div className="space-y-2">
            <Label>Item</Label>
            <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">
                    {selectedItemId === "custom"
                      ? "Custom Item"
                      : selectedItemId
                      ? items.find((i) => i.id === selectedItemId)?.name + " (" + items.find((i) => i.id === selectedItemId)?.sku + ")"
                      : "Select an item or create custom"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" align="start">
                <Command>
                  <CommandInput placeholder="Search items..." />
                  <CommandList className="max-h-[min(50vh,20rem)] overflow-y-auto overscroll-contain">
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="custom" onSelect={() => { handleItemSelect("custom"); setItemSearchOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedItemId === "custom" ? "opacity-100" : "opacity-0")} />
                        Custom Item
                      </CommandItem>
                      {items.map((item) => (
                        <CommandItem key={item.id} value={`${item.name} ${item.sku}`} onSelect={() => { handleItemSelect(item.id); setItemSearchOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", selectedItemId === item.id ? "opacity-100" : "opacity-0")} />
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

          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="addItemName">Item Name *</Label>
            <Input id="addItemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Enter item name" required />
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="addItemSku">SKU</Label>
            <Input id="addItemSku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Enter SKU" />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={0.01} step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : "")} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pcs", "kg", "lb", "m", "ft", "box", "pack"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price & GST */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Price ($)</Label>
              <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : "")} />
            </div>
            <div className="space-y-2">
              <Label>GST (%)</Label>
              <Input type="number" min={0} step={0.1} value={gstRate} onChange={(e) => setGstRate(e.target.value ? parseFloat(e.target.value) : "")} />
            </div>
          </div>

          {/* Extra Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Extra Cost Label</Label>
              <Input value={extraCostLabel} onChange={(e) => setExtraCostLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Extra Cost ($)</Label>
              <Input type="number" min={0} step={0.01} value={extraCost} onChange={(e) => setExtraCost(e.target.value ? parseFloat(e.target.value) : "")} />
            </div>
          </div>

          {/* Total Preview */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(subtotal + gstAmount + extra)}</span>
          </div>

          {/* Need By Date & Link */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Need By Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !needByDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {needByDate ? format(needByDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={needByDate} onSelect={setNeedByDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Link</Label>
              <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any notes..." rows={2} />
          </div>

          {/* Image & PDF */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Image</Label>
              {imagePreview ? (
                <div className="relative w-full h-28 rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload image</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> PDF</Label>
              {pdfFile ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50 h-28">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{pdfFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPdfFile(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    pdfDragOver ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
                  onDragLeave={() => setPdfDragOver(false)}
                  onDrop={handlePdfDrop}
                >
                  <FileText className={cn("h-5 w-5 mb-1", pdfDragOver ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-xs", pdfDragOver ? "text-primary font-medium" : "text-muted-foreground")}>
                    {pdfDragOver ? "Drop PDF here" : "Drag & drop or click"}
                  </span>
                  <input type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f?.type === "application/pdf") setPdfFile(f); }} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !itemName.trim()}>
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
