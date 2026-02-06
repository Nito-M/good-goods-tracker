import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Upload, X, Link as LinkIcon, CalendarIcon, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InventoryItem } from "@/types/inventory";
import { CreateRequestInput } from "@/types/request";

interface AddRequestDialogProps {
  items: InventoryItem[];
  requesterNames: string[];
  onSave: (request: CreateRequestInput) => Promise<any>;
  onUploadImage: (file: File) => Promise<string | null>;
}

export function AddRequestDialog({ items, requesterNames, onSave, onUploadImage }: AddRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [quantityUnit, setQuantityUnit] = useState("pcs");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [needByDate, setNeedByDate] = useState<Date | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedRequester, setSelectedRequester] = useState<string>("");

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
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
  };

  const resetForm = () => {
    setSelectedItemId("");
    setItemName("");
    setSku("");
    setQuantity(1);
    setQuantityUnit("pcs");
    setLink("");
    setNotes("");
    setNeedByDate(undefined);
    setImageUrl(null);
    setImageFile(null);
    setImagePreview(null);
    setSelectedRequester("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedRequester) return;

    setLoading(true);
    try {
      let uploadedImageUrl = imageUrl;
      if (imageFile) {
        uploadedImageUrl = await onUploadImage(imageFile);
      }

      await onSave({
        inventoryItemId: selectedItemId && selectedItemId !== "custom" ? selectedItemId : null,
        itemName: itemName.trim(),
        sku: sku.trim() || null,
        quantity,
        quantityUnit,
        link: link.trim() || null,
        notes: notes.trim() || null,
        imageUrl: uploadedImageUrl,
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
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Item Selection */}
          <div className="space-y-2">
            <Label>Item</Label>
            <Select value={selectedItemId} onValueChange={handleItemSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item or create custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Item</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name *</Label>
            <Input
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter item name"
              required
            />
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Enter SKU (optional)"
            />
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityUnit">Unit</Label>
              <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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

          {/* Need By Date */}
          <div className="space-y-2">
            <Label>Need By Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !needByDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {needByDate ? format(needByDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={needByDate}
                  onSelect={setNeedByDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link
            </Label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/product"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or specifications..."
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload an image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !itemName.trim() || !selectedRequester}>
              {loading ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
