import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Asset } from '@/hooks/useAssets';

const ASSET_TYPES = ['Vehicle', 'Machine', 'Equipment', 'Tool', 'Trailer'];
const STATUSES = ['active', 'in service', 'down', 'sold'];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (data: Partial<Asset>) => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
  initial?: Asset | null;
}

export function AddAssetDialog({ open, onOpenChange, onSave, uploadImage, initial }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [assetType, setAssetType] = useState(initial?.asset_type || 'Equipment');
  const [brand, setBrand] = useState(initial?.brand || '');
  const [model, setModel] = useState(initial?.model || '');
  const [year, setYear] = useState(initial?.year?.toString() || '');
  const [serialNumber, setSerialNumber] = useState(initial?.serial_number || '');
  const [vin, setVin] = useState(initial?.vin || '');
  const [motorType, setMotorType] = useState(initial?.motor_type || '');
  const [externalLink, setExternalLink] = useState(initial?.external_link || '');
  const [currentLocation, setCurrentLocation] = useState(initial?.current_location || '');
  const [assignedShop, setAssignedShop] = useState(initial?.assigned_shop || '');
  const [assignedEmployee, setAssignedEmployee] = useState(initial?.assigned_employee || '');
  const [status, setStatus] = useState(initial?.status || 'active');
  const [odometer, setOdometer] = useState(initial?.odometer?.toString() || '');
  const [engineHours, setEngineHours] = useState(initial?.engine_hours?.toString() || '');
  const [serviceIntervalDays, setServiceIntervalDays] = useState(initial?.service_interval_days?.toString() || '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '');
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setImageUrl(url);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      asset_type: assetType,
      brand,
      model,
      year: year ? parseInt(year) : null,
      serial_number: serialNumber,
      vin: vin || null,
      image_url: imageUrl || null,
      external_link: externalLink || null,
      current_location: currentLocation,
      assigned_shop: assignedShop,
      assigned_employee: assignedEmployee,
      status,
      odometer: odometer ? parseFloat(odometer) : null,
      engine_hours: engineHours ? parseFloat(engineHours) : null,
      service_interval_days: serviceIntervalDays ? parseInt(serviceIntervalDays) : null,
      motor_type: motorType || null,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Asset Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ford F-150" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Brand</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
            <div><Label>Model</Label><Input value={model} onChange={(e) => setModel(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></div>
            <div><Label>Serial Number</Label><Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} /></div>
          </div>
          <div><Label>VIN (optional)</Label><Input value={vin} onChange={(e) => setVin(e.target.value)} /></div>
          <div><Label>External Link</Label><Input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="Manual or spec page URL" /></div>
          <div><Label>Photo</Label><Input type="file" accept="image/*" onChange={handleImageUpload} /></div>
          {imageUrl && <img src={imageUrl} alt="Preview" className="h-20 w-20 rounded-md object-cover" />}
          <h4 className="font-medium text-sm pt-2">Location</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Current Location</Label><Input value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)} /></div>
            <div><Label>Assigned Shop/Yard</Label><Input value={assignedShop} onChange={(e) => setAssignedShop(e.target.value)} /></div>
          </div>
          <div><Label>Assigned Employee</Label><Input value={assignedEmployee} onChange={(e) => setAssignedEmployee(e.target.value)} /></div>
          <h4 className="font-medium text-sm pt-2">Tracking</h4>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Odometer</Label><Input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value)} /></div>
            <div><Label>Engine Hours</Label><Input type="number" value={engineHours} onChange={(e) => setEngineHours(e.target.value)} /></div>
            <div><Label>Service Interval (days)</Label><Input type="number" value={serviceIntervalDays} onChange={(e) => setServiceIntervalDays(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
