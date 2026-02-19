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
import { Plus, Upload, X, Link as LinkIcon, CalendarIcon, User, Check, ChevronsUpDown, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import { InventoryItem } from "@/types/inventory";
import { CreateRequestInput } from "@/types/request";

interface AddRequestDialogProps {
  items: InventoryItem[];
  requesterNames: string[];
  onSave: (request: CreateRequestInput) => Promise<any>;
  onUploadImage: (file: File) => Promise<string | null>;
  onUploadPdf: (file: File) => Promise<string | null>;
}

export function AddRequestDialog({ items, requesterNames, onSave, onUploadImage, onUploadPdf }: AddRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [quantityUnit, setQuantityUnit] = useState("pcs");
  const [price, setPrice] = useState<number | "">("");
  const [gstRate, setGstRate] = useState<number | "">(5);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [needByDate, setNeedByDate] = useState<Date | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedRequester, setSelectedRequester] = useState<string>("");
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDragOver, setPdfDragOver] = useState(false);

  // Calculate price breakdown
  const qty = typeof quantity === 'number' ? quantity : 0;
  const unitPrice = typeof price === 'number' ? price : 0;
  const gst = typeof gstRate === 'number' ? gstRate : 0;
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

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
  };

  const handlePdfFile = (file: File) => {
    if (file.type === "application/pdf") {
      setPdfFile(file);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePdfFile(file);
  };

  const handlePdfDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPdfDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfFile(file);
  }, []);

  const resetForm = () => {
    setSelectedItemId("");
    setItemName("");
    setSku("");
    setQuantity("");
    setQuantityUnit("pcs");
    setPrice("");
    setGstRate(5);
    setLink("");
    setNotes("");
    setNeedByDate(undefined);
    setImageUrl(null);
    setImageFile(null);
    setImagePreview(null);
    setSelectedRequester("");
    setPdfFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedRequester) return;

    setLoading(true);
    try {
      let uploadedImageUrl = imageUrl;
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
        link: link.trim() || null,
        notes: notes.trim() || null,
        imageUrl: uploadedImageUrl,
        pdfUrl: uploadedPdfUrl,
        needByDate: needByDate ? needByDate.toISOString() : null,
        requesterName: selectedRequester,
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Requester Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Requester *
            </Label>
            {requesterNames.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                No requesters configured. Please add requesters in Settings first.
              </p>
            ) : (
              <Select value={selectedRequester} onValueChange={setSelectedRequester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who is making this request" />
                </SelectTrigger>
                <SelectContent>
                  {requesterNames.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Item Selection */}
          <div className="space-y-2">
            <Label>Item</Label>
            <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={itemSearchOpen}
                  className="w-full justify-between font-normal"
                >
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
              <PopoverContent className="w-full p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
                <Command>
                  <CommandInput placeholder="Search items..." />
                  <CommandList>
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="custom" onSelect={() => { handleItemSelect("custom"); setItemSearchOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedItemId === "custom" ? "opacity-100" : "opacity-0")} />
                        Custom Item
                      </CommandItem>
                      {items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${item.name} ${item.sku}`}
                          onSelect={() => { handleItemSelect(item.id); setItemSearchOpen(false); }}
                        >
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
            <Label htmlFor="itemName">Item Name *</Label>
            <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Enter item name" required />
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Enter SKU" />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min={0.01} step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : "")} placeholder="Enter quantity" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityUnit">Unit</Label>
              <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                  <SelectItem value="pack">pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price & GST */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Unit Price ($) <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input id="price" type="number" min={0} step={0.00001} value={price} onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : 0)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstRate">GST Rate (%) <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input id="gstRate" type="number" min={0} max={100} step={0.1} value={gstRate} onChange={(e) => setGstRate(e.target.value ? parseFloat(e.target.value) : 0)} placeholder="0" />
            </div>
          </div>

          {/* Price Breakdown */}
          {unitPrice > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({qty || 1} × {formatCurrency(unitPrice)})</span>
                <span className="font-medium">{formatCurrency((qty || 1) * unitPrice)}</span>
              </div>
              {gst > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({gst}%)</span>
                  <span className="font-medium">{formatCurrency(((qty || 1) * unitPrice) * (gst / 100))}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatCurrency(((qty || 1) * unitPrice) * (1 + gst / 100))}</span>
              </div>
            </div>
          )}

          {/* Need By Date */}
          <div className="space-y-2">
            <Label>Need By Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !needByDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {needByDate ? format(needByDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={needByDate} onSelect={setNeedByDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link
            </Label>
            <Input id="link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/product" />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any notes or specifications..." rows={3} />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload an image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* PDF Upload — drag & drop */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF Attachment
            </Label>
            {pdfFile ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setPdfFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg transition-colors",
                  pdfDragOver ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
                onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
                onDragLeave={() => setPdfDragOver(false)}
                onDrop={handlePdfDrop}
              >
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Drag & drop a PDF or click to upload</span>
                  <input type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !itemName.trim() || !selectedRequester}>
              {loading ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
