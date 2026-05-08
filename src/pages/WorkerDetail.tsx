import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Mail, MapPin, Calendar, DollarSign, Briefcase, Users, FileText, Image as ImageIcon, Download, Upload, Globe, Eye, EyeOff, Copy, Building2, Plus, User as UserIcon, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWorkers, useWorkerFiles } from '@/hooks/useWorkers';
import { useWorkerVendors, type WorkerVendor } from '@/hooks/useWorkerVendors';
import { AddWorkerDialog } from '@/components/AddWorkerDialog';
import { WorkerAccessCard } from '@/components/WorkerAccessCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/15 text-green-700 dark:text-green-400',
  inactive: 'bg-muted text-muted-foreground',
};

export function WorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workers, loading, updateWorker, deleteWorker, uploadWorkerPhoto } = useWorkers();
  const workerFiles = useWorkerFiles(id || null);
  const { vendors, addVendor, updateVendor, deleteVendor } = useWorkerVendors(id || null);
  const [editOpen, setEditOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<WorkerVendor | null>(null);
  const [showPasswordIds, setShowPasswordIds] = useState<Record<string, boolean>>({});
  const [showDialogPassword, setShowDialogPassword] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vName, setVName] = useState('');
  const [vUsername, setVUsername] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPassword, setVPassword] = useState('');
  const [vLink, setVLink] = useState('');
  const [vNotes, setVNotes] = useState('');

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  const worker = useMemo(() => workers.find((w) => w.id === id), [workers, id]);

  const openVendorDialog = (existing?: WorkerVendor) => {
    setEditingVendor(existing || null);
    setVName(existing?.vendor_name || '');
    setVUsername(existing?.vendor_username || '');
    setVEmail(existing?.vendor_email || '');
    setVPassword(existing?.vendor_password || '');
    setVLink(existing?.vendor_link || '');
    setVNotes(existing?.vendor_notes || '');
    setShowDialogPassword(false);
    setVendorOpen(true);
  };

  const saveVendor = async () => {
    const payload = {
      vendor_name: vName || null,
      vendor_username: vUsername || null,
      vendor_email: vEmail || null,
      vendor_password: vPassword || null,
      vendor_link: vLink || null,
      vendor_notes: vNotes || null,
    };
    if (editingVendor) {
      await updateVendor(editingVendor.id, payload);
    } else {
      await addVendor(payload);
    }
    setVendorOpen(false);
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await workerFiles.uploadFile(f);
    e.target.value = '';
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!worker) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">Worker not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <h1 className="text-lg font-bold text-card-foreground truncate">{worker.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete worker?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {worker.name}. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => { await deleteWorker(worker.id); navigate('/assets'); }}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {worker.photo_url ? (
                <img src={worker.photo_url} alt={worker.name} className="h-32 w-32 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">{worker.name}</h2>
                  <Badge variant="secondary" className={STATUS_COLORS[worker.status] || ''}>{worker.status}</Badge>
                </div>
                {worker.job_title && (
                  <p className="text-muted-foreground flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {worker.job_title}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm pt-2">
                  {worker.email && (
                    <a href={`mailto:${worker.email}`} className="flex items-center gap-2 text-foreground hover:underline">
                      <Mail className="h-4 w-4 text-muted-foreground" /> {worker.email}
                    </a>
                  )}
                  {worker.phone && (
                    <a href={`tel:${worker.phone}`} className="flex items-center gap-2 text-foreground hover:underline">
                      <Phone className="h-4 w-4 text-muted-foreground" /> {worker.phone}
                    </a>
                  )}
                  {worker.address && (
                    <div className="flex items-center gap-2 text-foreground"><MapPin className="h-4 w-4 text-muted-foreground" /> {worker.address}</div>
                  )}
                  {worker.start_date && (
                    <div className="flex items-center gap-2 text-foreground"><Calendar className="h-4 w-4 text-muted-foreground" /> Started {worker.start_date}</div>
                  )}
                  {worker.hourly_rate != null && (
                    <div className="flex items-center gap-2 text-foreground"><DollarSign className="h-4 w-4 text-muted-foreground" /> ${worker.hourly_rate}/hr</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {worker.notes && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-2 text-foreground">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{worker.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Vendor Accounts
                {vendors.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{vendors.length}</Badge>
                )}
              </h3>
              <Button size="sm" onClick={() => openVendorDialog()}>
                <Plus className="h-4 w-4 mr-1" /> Add Vendor
              </Button>
            </div>

            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendor accounts yet.</p>
            ) : (
              <>
                <div className="mb-3">
                  <Input
                    placeholder="Search vendors..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                  />
                </div>
                {(() => {
                  const q = vendorSearch.trim().toLowerCase();
                  const sorted = [...vendors].sort((a, b) =>
                    (a.vendor_name || '').localeCompare(b.vendor_name || '', undefined, { sensitivity: 'base' })
                  );
                  const filtered = q
                    ? sorted.filter((v) =>
                        [v.vendor_name, v.vendor_username, v.vendor_email, v.vendor_link, v.vendor_notes]
                          .some((f) => (f || '').toLowerCase().includes(q))
                      )
                    : sorted;
                  if (filtered.length === 0) {
                    return <p className="text-sm text-muted-foreground">No vendors match "{vendorSearch}".</p>;
                  }
                  return (
                    <div className="space-y-3">
                      {filtered.map((v) => {
                  const showPwd = !!showPasswordIds[v.id];
                  return (
                    <div key={v.id} className="rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xl font-bold text-primary truncate">
                            {v.vendor_name || 'Untitled vendor'}
                          </h4>
                          {v.vendor_link && (
                            <a href={v.vendor_link} target="_blank" rel="noreferrer" className="text-xs text-primary/80 hover:underline inline-flex items-center gap-1 mt-0.5">
                              <Globe className="h-3 w-3" /> {v.vendor_link}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => openVendorDialog(v)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteVendor(v.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {v.vendor_username && (
                          <div className="flex items-center gap-2 text-foreground min-w-0">
                            <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground shrink-0">Username:</span>
                            <span className="truncate">{v.vendor_username}</span>
                            <button onClick={() => copy(v.vendor_username!, 'Username')} className="text-muted-foreground hover:text-foreground">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {v.vendor_email && (
                          <div className="flex items-center gap-2 text-foreground min-w-0">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a href={`mailto:${v.vendor_email}`} className="hover:underline truncate">{v.vendor_email}</a>
                            <button onClick={() => copy(v.vendor_email!, 'Email')} className="text-muted-foreground hover:text-foreground">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {v.vendor_password && (
                          <div className="flex items-center gap-2 text-foreground min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0">Password:</span>
                            <span className="font-mono text-xs truncate">
                              {showPwd ? v.vendor_password : '••••••••'}
                            </span>
                            <button onClick={() => setShowPasswordIds((s) => ({ ...s, [v.id]: !s[v.id] }))} className="text-muted-foreground hover:text-foreground">
                              {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={() => copy(v.vendor_password!, 'Password')} className="text-muted-foreground hover:text-foreground">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {v.vendor_notes && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-3 pt-3 border-t border-border">
                          {v.vendor_notes}
                        </p>
                      )}
                    </div>
                  );
                })}
                    </div>
                  );
                })()}
              </>
            )}
          </CardContent>
        </Card>

        <WorkerAccessCard workerId={worker.id} workerOwnerId={worker.user_id} />

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Attachments</h3>
              <label className="cursor-pointer">
                <input type="file" multiple className="hidden" onChange={handleFilesUpload} accept="image/*,application/pdf" />
                <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Upload className="h-3 w-3" /> Upload
                </span>
              </label>
            </div>
            <div className="space-y-1.5">
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
          </CardContent>
        </Card>
      </main>

      <AddWorkerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        uploadPhoto={uploadWorkerPhoto}
        initial={worker}
        onSave={async (data) => {
          await updateWorker(worker.id, data);
          return worker;
        }}
      />

      <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? 'Edit Vendor Account' : 'Add Vendor Account'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-name">Vendor name</Label>
              <Input id="v-name" value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Vendor company name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-username">Username</Label>
              <Input id="v-username" value={vUsername} onChange={(e) => setVUsername(e.target.value)} placeholder="login username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-email">Email</Label>
              <Input id="v-email" type="email" value={vEmail} onChange={(e) => setVEmail(e.target.value)} placeholder="account@vendor.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-password">Password</Label>
              <div className="relative">
                <Input
                  id="v-password"
                  type={showDialogPassword ? 'text' : 'password'}
                  value={vPassword}
                  onChange={(e) => setVPassword(e.target.value)}
                  placeholder="Account password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowDialogPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showDialogPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-link">Website link</Label>
              <Input id="v-link" type="url" value={vLink} onChange={(e) => setVLink(e.target.value)} placeholder="https://vendor.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-notes">Notes</Label>
              <Textarea id="v-notes" value={vNotes} onChange={(e) => setVNotes(e.target.value)} rows={3} placeholder="Additional details..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendorOpen(false)}>Cancel</Button>
            <Button onClick={saveVendor}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
