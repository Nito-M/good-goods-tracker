import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, FileText, ImageIcon, X, ExternalLink, Printer, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useJobInstruction, useJobInstructions } from '@/hooks/useJobInstructions';
import { useInventory } from '@/hooks/useInventory';
import { useToast } from '@/hooks/use-toast';

const BUCKET = 'job-instruction-files';

export function JobInstructionEdit() {
  const { jobId, instructionId } = useParams<{ jobId: string; instructionId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !instructionId || instructionId === 'new';

  const { createInstruction } = useJobInstructions(jobId ?? null);
  const { instruction, files, parts, loading, uploadFile, deleteFile, getSignedUrl, addPart, updatePart, removePart, refetch } =
    useJobInstruction(isNew ? null : instructionId!);
  const { allItems: inventoryItems } = useInventory();
  const [partSearch, setPartSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (instruction) {
      setTitle(instruction.title);
      setContent(instruction.content || '');
    }
  }, [instruction]);

  // Auto-grow textarea
  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(el.scrollHeight, 200) + 'px';
    }
  }, [content]);

  // Resolve signed URLs for image previews
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const imageFiles = files.filter(f => (f.file_type || '').startsWith('image/'));
      const entries = await Promise.all(imageFiles.map(async f => {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(f.file_url, 60 * 60);
        return [f.id, data?.signedUrl || ''] as const;
      }));
      if (cancelled) return;
      const map: Record<string, string> = {};
      entries.forEach(([id, url]) => { if (url) map[id] = url; });
      setThumbUrls(map);
    })();
    return () => { cancelled = true; };
  }, [files]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    if (isNew) {
      const newId = await createInstruction(title.trim(), content.trim() || null);
      setSaving(false);
      if (newId) navigate(`/jobs/${jobId}/instructions/${newId}`, { replace: true });
    } else if (instruction) {
      const { error } = await supabase
        .from('job_instructions')
        .update({ title: title.trim(), content: content.trim() || null })
        .eq('id', instruction.id);
      setSaving(false);
      if (error) {
        toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Saved' });
        refetch();
      }
    } else {
      setSaving(false);
    }
  };

  const handleFilesSelected = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    if (isNew || !instruction) {
      toast({ title: 'Save the title first', description: 'You can attach files after the instruction is created.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    for (const f of Array.from(list)) {
      await uploadFile(f);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFile = async (id: string) => {
    const url = await getSignedUrl(id);
    if (url) window.open(url, '_blank');
  };

  const filteredInventory = useMemo(() => {
    const q = partSearch.trim().toLowerCase();
    if (!q) return inventoryItems.slice(0, 30);
    return inventoryItems.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.sku || '').toLowerCase().includes(q) ||
      (i.internalPartNumber || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }, [inventoryItems, partSearch]);

  const handleAddInventoryPart = async (inv: typeof inventoryItems[number]) => {
    await addPart({
      inventoryItemId: inv.id,
      itemName: inv.name,
      sku: inv.sku || inv.internalPartNumber || '',
      quantity: 1,
    });
    setPartSearch('');
    setPickerOpen(false);
  };

  const handlePrint = () => {
    const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!));
    const partsRows = parts.map(p => `
      <tr>
        <td>${esc(p.item_name)}</td>
        <td>${esc(p.sku || '')}</td>
        <td style="text-align:right">${p.quantity}</td>
        <td>${esc(p.notes || '')}</td>
      </tr>`).join('');
    const filesList = files.map(f => `<li>${esc(f.file_name)}</li>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title || 'Instruction')}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;padding:32px;max-width:800px;margin:0 auto;}
  h1{font-size:22px;margin:0 0 4px;}
  .meta{color:#666;font-size:12px;margin-bottom:24px;}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#444;margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px;}
  pre{white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.5;margin:12px 0;}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top;}
  th{background:#f5f5f5;}
  ul{font-size:12px;margin:8px 0 0 20px;padding:0;}
  @media print { body{padding:0;} }
</style></head><body>
<h1>${esc(title || 'Instruction')}</h1>
<div class="meta">Printed ${new Date().toLocaleString()}</div>
${content.trim() ? `<h2>Instructions</h2><pre>${esc(content)}</pre>` : ''}
${parts.length ? `<h2>Parts List</h2><table><thead><tr><th>Item</th><th>Part #</th><th style="text-align:right">Qty</th><th>Notes</th></tr></thead><tbody>${partsRows}</tbody></table>` : ''}
${files.length ? `<h2>Attached Files</h2><ul>${filesList}</ul>` : ''}
<script>window.onload=()=>{setTimeout(()=>window.print(),150);}</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
      toast({ title: 'Popup blocked', description: 'Allow popups to print.', variant: 'destructive' });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const backTo = `/jobs/${jobId}?tab=instructions`;


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link to={backTo}>
                <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">
                  {isNew ? 'Add Install Instruction' : (title || 'Edit Instruction')}
                </h1>
                <p className="text-xs text-muted-foreground">Install & how-to details for this job</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint} disabled={isNew}>
                <Printer className="h-4 w-4 mr-2" />Print
              </Button>
              <Button onClick={handleSave} disabled={saving || !title.trim()}>
                {saving ? 'Saving...' : (isNew ? 'Create' : 'Save')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {loading && !isNew ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle>Instruction</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ji-title">Title *</Label>
                  <Input
                    id="ji-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Installing rear axle brake lines"
                  />
                </div>
                <div>
                  <Label htmlFor="ji-content">Instructions (text)</Label>
                  <Textarea
                    id="ji-content"
                    ref={contentRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Steps, torque specs, wiring notes, part numbers..."
                    className="min-h-[200px] resize-none overflow-hidden"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Parts List ({parts.length})</span>
                  <Popover open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (!o) setPartSearch(''); }}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isNew}>
                        <Plus className="h-4 w-4 mr-2" />Add Part
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[380px] p-0">
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            autoFocus
                            value={partSearch}
                            onChange={e => setPartSearch(e.target.value)}
                            placeholder="Search inventory by name or part #..."
                            className="pl-7 h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {filteredInventory.length === 0 ? (
                          <p className="text-xs text-muted-foreground p-3 text-center">No matching items</p>
                        ) : filteredInventory.map(inv => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => handleAddInventoryPart(inv)}
                            className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{inv.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {inv.sku || inv.internalPartNumber || '—'} · Stock: {inv.quantity}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isNew ? (
                  <p className="text-sm text-muted-foreground">Save the title first to add parts.</p>
                ) : parts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No parts added. Add inventory items you'll need for this install (reference only — no stock is reserved).</p>
                ) : (
                  <div className="space-y-1.5">
                    {parts.map(p => (
                      <div key={p.id} className="flex items-center gap-2 p-2 border border-border rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.item_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.sku || '—'}</p>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={p.quantity}
                          onChange={e => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v !== p.quantity) updatePart(p.id, { quantity: v });
                          }}
                          className="w-20 h-8 text-sm text-center"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removePart(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>



            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>PDFs & Images</span>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleFilesSelected(e.target.files)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || isNew}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isNew ? (
                  <p className="text-sm text-muted-foreground">Save the title first to attach PDFs or images.</p>
                ) : files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No files attached yet. Upload PDFs or images related to this install.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map(f => {
                      const isImage = (f.file_type || '').startsWith('image/');
                      const isPdf = (f.file_type || '').includes('pdf');
                      const thumb = thumbUrls[f.id];
                      return (
                        <div key={f.id} className="group relative border border-border rounded-md overflow-hidden bg-muted/30">
                          <button
                            type="button"
                            onClick={() => openFile(f.id)}
                            className="w-full aspect-square flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
                          >
                            {isImage && thumb ? (
                              <img src={thumb} alt={f.file_name} className="w-full h-full object-cover" />
                            ) : isPdf ? (
                              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                <FileText className="h-10 w-10" />
                                <span className="text-[10px] uppercase">PDF</span>
                              </div>
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </button>
                          <div className="p-2 text-xs flex items-center justify-between gap-2 border-t border-border">
                            <span className="truncate flex-1" title={f.file_name}>{f.file_name}</span>
                            <button
                              type="button"
                              onClick={() => openFile(f.id)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Open"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteFile(f.id)}
                              className="text-destructive hover:text-destructive/80"
                              title="Delete"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

export default JobInstructionEdit;
