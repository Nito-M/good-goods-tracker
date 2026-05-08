import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, Calendar, DollarSign, Briefcase, Users, FileText, Image as ImageIcon, Download, Upload, Globe, Eye, EyeOff, Copy, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useWorkers, useWorkerFiles } from '@/hooks/useWorkers';
import { AddWorkerDialog } from '@/components/AddWorkerDialog';
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
  const [editOpen, setEditOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  const worker = useMemo(() => workers.find((w) => w.id === id), [workers, id]);

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

        {(worker.vendor_name || worker.vendor_email || worker.vendor_password || worker.vendor_link || worker.vendor_notes) && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Vendor Account
              </h3>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {worker.vendor_name && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> {worker.vendor_name}
                  </div>
                )}
                {worker.vendor_email && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${worker.vendor_email}`} className="hover:underline truncate">{worker.vendor_email}</a>
                    <button onClick={() => copy(worker.vendor_email!, 'Email')} className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {worker.vendor_password && (
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="font-mono text-xs">
                      {showPassword ? worker.vendor_password : '••••••••'}
                    </span>
                    <button onClick={() => setShowPassword((s) => !s)} className="text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => copy(worker.vendor_password!, 'Password')} className="text-muted-foreground hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {worker.vendor_link && (
                  <div className="flex items-center gap-2 text-foreground sm:col-span-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={worker.vendor_link} target="_blank" rel="noreferrer" className="hover:underline truncate text-primary">
                      {worker.vendor_link}
                    </a>
                  </div>
                )}
              </div>
              {worker.vendor_notes && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-3 pt-3 border-t border-border">
                  {worker.vendor_notes}
                </p>
              )}
            </CardContent>
          </Card>
        )}

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
    </div>
  );
}
