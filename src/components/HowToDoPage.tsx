import { useState, useRef, useCallback, useEffect } from "react";
import { useHowToInstructions, HowToInstruction } from "@/hooks/useHowToInstructions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Plus,
  BookOpen,
  Search,
  MoreVertical,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  User,
  X,
  ExternalLink,
  File,
  Eye,
  Pencil,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { ImageViewerDialog } from "@/components/ImageViewerDialog";

const INSTRUCTION_TYPES = [
  "General",
  "Safety",
  "Maintenance",
  "Assembly",
  "Operation",
  "Repair",
  "Installation",
  "Inspection",
  "Other",
];

export function HowToDoPage() {
  const {
    instructions,
    loading,
    addInstruction,
    updateInstruction,
    deleteInstruction,
    uploadFile,
    deleteFile,
  } = useHowToInstructions();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [viewingInstruction, setViewingInstruction] = useState<HowToInstruction | null>(null);
  const [editingInstruction, setEditingInstruction] = useState<HowToInstruction | null>(null);

  // Intercept browser back button when a dialog is open
  const hasOpenDialog = !!(viewingInstruction || editingInstruction || isCreating);

  useEffect(() => {
    if (!hasOpenDialog) return;

    window.history.pushState({ howToDialog: true }, "");

    const handlePopState = () => {
      setViewingInstruction(null);
      setEditingInstruction(null);
      setIsCreating(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasOpenDialog]);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("General");
  const [newLink, setNewLink] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  // Notes editor state (inside instruction view)
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // File upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Image viewer
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // PDF preview
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const filteredInstructions = instructions.filter(
    (inst) =>
      inst.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inst.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const id = await addInstruction({
      title: newTitle.trim(),
      type: newType,
      link: newLink.trim() || undefined,
      authorName: newAuthor.trim(),
    });
    if (id) {
      setNewTitle("");
      setNewType("General");
      setNewLink("");
      setNewAuthor("");
      setIsCreating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!viewingInstruction) return;
    setSavingNotes(true);
    await updateInstruction(viewingInstruction.id, { notes: notesValue });
    setViewingInstruction({ ...viewingInstruction, notes: notesValue });
    setIsEditingNotes(false);
    setSavingNotes(false);
  };

  const handleStartEditingNotes = () => {
    setNotesValue(viewingInstruction?.notes || "");
    setIsEditingNotes(true);
    setTimeout(() => notesRef.current?.focus(), 50);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this instruction and all its files?")) {
      await deleteInstruction(id);
      setViewingInstruction(null);
      setEditingInstruction(null);
    }
  };

  const handleFileDrop = useCallback(
    async (files: FileList, instructionId: string) => {
      setUploading(true);
      for (const file of Array.from(files)) {
        await uploadFile(instructionId, file);
      }
      setUploading(false);
    },
    [uploadFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent, instructionId: string) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files, instructionId);
    }
  };

  const isImage = (type: string) => type.startsWith("image/");

  const InstructionCard = ({ inst }: { inst: HowToInstruction }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => setViewingInstruction(inst)}
    >
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{inst.title || "Untitled"}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{inst.type}</Badge>
            {inst.authorName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {inst.authorName}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setEditingInstruction(inst);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(inst.id);
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 mt-1">
          {inst.files.length > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {inst.files.length} file{inst.files.length !== 1 ? "s" : ""}
            </span>
          )}
          {inst.link && (
            <span className="text-xs text-primary flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Link
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {format(new Date(inst.updatedAt), "MMM d, yyyy")}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Search + Add Button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search instructions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Instruction
        </Button>
      </div>

      {isCreating ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">New Instruction</h2>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Title *</label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="How to..." />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSTRUCTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Added By</label>
              <Input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} placeholder="Name" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Link</label>
              <Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button onClick={handleCreate} disabled={!newTitle.trim()} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Instruction
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Grid */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : filteredInstructions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No instructions yet</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search" : "Create your first instruction to get started"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredInstructions.map((inst) => (
                <InstructionCard key={inst.id} inst={inst} />
              ))}
            </div>
          )}
        </>
      )}

      {/* View/Detail Dialog - Full screen */}
      <Dialog open={!!viewingInstruction} onOpenChange={(open) => !open && setViewingInstruction(null)}>
        <DialogContent className="max-w-none w-screen h-screen m-0 p-6 rounded-none flex flex-col">
          {viewingInstruction && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{viewingInstruction.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{viewingInstruction.type}</Badge>
                      {viewingInstruction.authorName && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {viewingInstruction.authorName}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(viewingInstruction.updatedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingInstruction(viewingInstruction);
                      setViewingInstruction(null);
                    }}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(viewingInstruction.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-6 mt-4">
                {viewingInstruction.link && (
                  <a
                    href={viewingInstruction.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {viewingInstruction.link}
                  </a>
                )}

                {/* Notes - Google Docs style */}
                <div className="border rounded-lg bg-card shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    {isEditingNotes ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingNotes(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          className="gap-1"
                        >
                          <Save className="h-3 w-3" />
                          {savingNotes ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleStartEditingNotes}
                        className="gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        {viewingInstruction.notes ? "Edit" : "Add Notes"}
                      </Button>
                    )}
                  </div>
                  <div className="p-4 min-h-[200px]">
                    {isEditingNotes ? (
                      <textarea
                        ref={notesRef}
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        className="w-full min-h-[200px] resize-none bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-muted-foreground/50"
                        placeholder="Start typing your notes here..."
                      />
                    ) : viewingInstruction.notes ? (
                      <p
                        className="whitespace-pre-wrap text-sm leading-relaxed cursor-pointer hover:bg-muted/30 rounded p-1 -m-1 transition-colors"
                        onClick={handleStartEditingNotes}
                      >
                        {viewingInstruction.notes}
                      </p>
                    ) : (
                      <p
                        className="text-sm text-muted-foreground/50 italic cursor-pointer hover:bg-muted/30 rounded p-1 -m-1 transition-colors"
                        onClick={handleStartEditingNotes}
                      >
                        Click "Add Notes" or click here to start writing...
                      </p>
                    )}
                  </div>
                </div>

                {/* File Upload Area */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Files & Images</h3>
                  <div
                    ref={dropRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, viewingInstruction.id)}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                      dragOver ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop files here, or{" "}
                      <button
                        className="text-primary underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDFs, images, and documents</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFileDrop(e.target.files, viewingInstruction.id);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
                </div>

                {/* Files Grid */}
                {viewingInstruction.files.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {viewingInstruction.files.map((file) => (
                      <Card key={file.id} className="overflow-hidden">
                        {isImage(file.fileType) && file.signedUrl ? (
                          <div
                            className="h-40 bg-muted cursor-pointer relative group"
                            onClick={() => setViewerImage(file.signedUrl!)}
                          >
                            <img
                              src={file.signedUrl}
                              alt={file.fileName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                         ) : file.fileType === "application/pdf" && file.signedUrl ? (
                          <div
                            className="h-40 bg-muted flex items-center justify-center cursor-pointer relative group"
                            onClick={() => setPreviewPdfUrl(file.signedUrl!)}
                          >
                            <FileText className="h-12 w-12 text-muted-foreground" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-40 bg-muted flex items-center justify-center">
                            <File className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{file.fileName}</p>
                          </div>
                          <div className="flex gap-1">
                            {file.signedUrl && (
                              <a href={file.signedUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteFile(file.id, file.fileUrl)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingInstruction} onOpenChange={(open) => !open && setEditingInstruction(null)}>
        <DialogContent className="max-w-lg">
          {editingInstruction && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Instruction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editingInstruction.title}
                    onChange={(e) => setEditingInstruction({ ...editingInstruction, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={editingInstruction.type}
                    onValueChange={(v) => setEditingInstruction({ ...editingInstruction, type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INSTRUCTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Added By</label>
                  <Input
                    value={editingInstruction.authorName}
                    onChange={(e) => setEditingInstruction({ ...editingInstruction, authorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Link</label>
                  <Input
                    value={editingInstruction.link || ""}
                    onChange={(e) => setEditingInstruction({ ...editingInstruction, link: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingInstruction(null)}>Cancel</Button>
                  <Button onClick={async () => {
                    await updateInstruction(editingInstruction.id, {
                      title: editingInstruction.title,
                      type: editingInstruction.type,
                      link: editingInstruction.link || undefined,
                      authorName: editingInstruction.authorName,
                      notes: editingInstruction.notes || undefined,
                    });
                    setEditingInstruction(null);
                  }}>
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <ImageViewerDialog
        imageUrl={viewerImage || ""}
        alt="Instruction file"
        open={!!viewerImage}
        onOpenChange={(open) => !open && setViewerImage(null)}
      />

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewPdfUrl} onOpenChange={(open) => !open && setPreviewPdfUrl(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-4 pt-0">
            {previewPdfUrl && (
              <iframe
                src={previewPdfUrl}
                className="w-full h-full rounded border"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
