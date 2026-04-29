import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Worker, useWorkerFiles } from '@/hooks/useWorkers';
import { Trash2, Upload, FileText, Image as ImageIcon, Download } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (data: Partial<Worker>) => Promise<Worker | null | void>;
  uploadPhoto: (file: File) => Promise<string | null>;
  initial?: Worker | null;
}

export function AddWorkerDialog({ open, onOpenChange, onSave, uploadPhoto, initial }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const workerFiles = useWorkerFiles(initial?.id || null);

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setEmail(initial?.email || '');
      setPhone(initial?.phone || '');
      setJobTitle(initial?.job_title || '');
      setAddress(initial?.address || '');
      setStartDate(initial?.start_date || '');
      setHourlyRate(initial?.hourly_rate?.toString() || '');
      setStatus(initial?.status || 'active');
      setNotes(initial?.notes || '');
      setPhotoUrl(initial?.photo_url || '');
    }
  }, [open, initial]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadPhoto(file);
    if (url) setPhotoUrl(url);
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      await workerFiles.uploadFile(f);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      job_title: jobTitle || null,
      address: address || null,
      start_date: startDate || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      status,
      notes: notes || null,
      photo_url: photoUrl || null,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Worker' : 'Add Worker'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Job Title</Label><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Welder" /></div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>Hourly Rate</Label><Input type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} /></div>
          </div>
          <div>
            <Label>Photo</Label>
            <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
            {photoUrl && <img src={photoUrl} alt="Worker" className="mt-2 h-20 w-20 rounded-md object-cover" />}
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything important about this worker..." />
          </div>

          {initial && (
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Attachments</Label>
                <label className="cursor-pointer">
                  <input type="file" multiple className="hidden" onChange={handleFilesUpload} accept="image/*,application/pdf" />
                  <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Upload className="h-3 w-3" /> Upload
                  </span>
                </label>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {workerFiles.files.length === 0 && (
                  <p className="text-xs text-muted-foreground">No attachments yet.</p>
                )}
                {workerFiles.files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-xs">
                    {f.file_type?.startsWith('image/') ? <ImageIcon className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                    <a href={f.signed_url} target="_blank" rel="noreferrer" className="flex-1 truncate text-foreground hover:underline">{f.file_name}</a>
                    {f.signed_url && (
                      <a href={f.signed_url} download={f.file_name} className="text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5" /></a>
                    )}
                    <button onClick={() => workerFiles.deleteFile(f)} className="text-destructive hover:opacity-80"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
