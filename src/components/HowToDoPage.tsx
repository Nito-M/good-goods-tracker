import { useState, useRef, useCallback, useEffect } from "react";
import { useHowToInstructions, HowToInstruction } from "@/hooks/useHowToInstructions";
import { useInstructionCards, InstructionCard } from "@/hooks/useInstructionCards";
import { useProfile } from "@/hooks/useProfile";
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
  const { profile } = useProfile();
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

  // Cards hook
  const {
    cards,
    addCard,
    updateCard,
    deleteCard,
    uploadCardFile,
    deleteCardFile,
  } = useInstructionCards(viewingInstruction?.id || null);

  // Card UI state
  const [addingCard, setAddingCard] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [editingCard, setEditingCard] = useState<InstructionCard | null>(null);
  const [editCardName, setEditCardName] = useState("");
  const [editCardDesc, setEditCardDesc] = useState("");
  const [editCardLink, setEditCardLink] = useState("");
  const [viewingCard, setViewingCard] = useState<InstructionCard | null>(null);
  const [cardUploading, setCardUploading] = useState(false);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const [cardPdfUrl, setCardPdfUrl] = useState<string | null>(null);
  const [cardPdfBlob, setCardPdfBlob] = useState<string | null>(null);
  const [cardPdfLoading, setCardPdfLoading] = useState(false);
  const [isEditingCardNotes, setIsEditingCardNotes] = useState(false);
  const [cardNotesValue, setCardNotesValue] = useState("");
  const [savingCardNotes, setSavingCardNotes] = useState(false);
  const cardNotesRef = useRef<HTMLTextAreaElement>(null);

  // Sync viewingCard with latest cards data
  useEffect(() => {
    if (viewingCard) {
      const updated = cards.find((c) => c.id === viewingCard.id);
      if (updated) setViewingCard(updated);
    }
  }, [cards]);

  // Intercept browser back button when a dialog is open
  const hasOpenDialog = !!(viewingInstruction || editingInstruction || isCreating || viewingCard || editingCard);

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

  // Sync viewingInstruction with latest data from instructions array
  useEffect(() => {
    if (viewingInstruction) {
      const updated = instructions.find((i) => i.id === viewingInstruction.id);
      if (updated) {
        setViewingInstruction(updated);
      }
    }
  }, [instructions]);

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
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePreviewPdf = async (signedUrl: string) => {
    setPdfLoading(true);
    setPreviewPdfUrl(signedUrl);

    if (pdfBlobUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setPdfBlobUrl(null);

    try {
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );

      setPdfBlobUrl(objectUrl);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      setPdfBlobUrl(null);
    } finally {
      setPdfLoading(false);
    }
  };

  const closePreviewPdf = () => {
    if (pdfBlobUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(pdfBlobUrl);
    }
    setPdfBlobUrl(null);
    setPreviewPdfUrl(null);
  };

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
                            onClick={() => handlePreviewPdf(file.signedUrl!)}
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

                {/* Cards Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Cards</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setAddingCard(true); setNewCardName(""); }}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Card
                    </Button>
                  </div>

                  {addingCard && (
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        placeholder="Card name..."
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newCardName.trim()) {
                            addCard(newCardName.trim(), profile?.displayName || "");
                            setNewCardName("");
                            setAddingCard(false);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        disabled={!newCardName.trim()}
                        onClick={() => {
                          addCard(newCardName.trim(), profile?.displayName || "");
                          setNewCardName("");
                          setAddingCard(false);
                        }}
                      >
                        Create
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setAddingCard(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {cards.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {cards.map((card) => (
                        <Card
                          key={card.id}
                          className="cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => setViewingCard(card)}
                        >
                          {/* Show first image/pdf thumbnail */}
                          {card.files.length > 0 && (() => {
                            const firstImg = card.files.find((f) => f.fileType.startsWith("image/"));
                            const firstPdf = card.files.find((f) => f.fileType === "application/pdf");
                            if (firstImg?.signedUrl) {
                              return (
                                <div className="h-32 bg-muted overflow-hidden">
                                  <img src={firstImg.signedUrl} alt={card.name} className="w-full h-full object-cover" />
                                </div>
                              );
                            }
                            if (firstPdf) {
                              return (
                                <div className="h-32 bg-muted flex items-center justify-center">
                                  <FileText className="h-10 w-10 text-muted-foreground" />
                                </div>
                              );
                            }
                            return null;
                          })()}
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm truncate">{card.name || "Untitled Card"}</p>
                                {card.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCard(card);
                                    setEditCardName(card.name);
                                    setEditCardDesc(card.description);
                                    setEditCardLink(card.link || "");
                                  }}>
                                    <Pencil className="h-3 w-3 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Delete this card?")) deleteCard(card.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {card.createdBy && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {card.createdBy}
                                </span>
                              )}
                              {card.files.length > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {card.files.length}
                                </span>
                              )}
                              {card.link && (
                                <span className="text-xs text-primary flex items-center gap-1">
                                  <LinkIcon className="h-3 w-3" />
                                  Link
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Card Dialog */}
      <Dialog open={!!viewingCard} onOpenChange={(open) => !open && setViewingCard(null)}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col">
          {viewingCard && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{viewingCard.name || "Untitled Card"}</DialogTitle>
                    {viewingCard.description && (
                      <p className="text-sm text-muted-foreground mt-1">{viewingCard.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      {viewingCard.createdBy && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Created by {viewingCard.createdBy}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(viewingCard.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingCard(viewingCard);
                      setEditCardName(viewingCard.name);
                      setEditCardDesc(viewingCard.description);
                      setEditCardLink(viewingCard.link || "");
                    }}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => {
                      if (confirm("Delete this card?")) {
                        deleteCard(viewingCard.id);
                        setViewingCard(null);
                      }
                    }}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-4 mt-2">
                {viewingCard.link && (
                  <a href={viewingCard.link} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 text-sm">
                    <ExternalLink className="h-4 w-4" /> {viewingCard.link}
                  </a>
                )}

                {/* Card Notes - Google Docs style */}
                <div className="border rounded-lg bg-card shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    {isEditingCardNotes ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingCardNotes(false)}>Cancel</Button>
                        <Button size="sm" disabled={savingCardNotes} className="gap-1" onClick={async () => {
                          if (!viewingCard) return;
                          setSavingCardNotes(true);
                          await updateCard(viewingCard.id, { notes: cardNotesValue });
                          setIsEditingCardNotes(false);
                          setSavingCardNotes(false);
                        }}>
                          <Save className="h-3 w-3" />
                          {savingCardNotes ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => {
                        setCardNotesValue(viewingCard?.notes || "");
                        setIsEditingCardNotes(true);
                        setTimeout(() => cardNotesRef.current?.focus(), 50);
                      }}>
                        <Pencil className="h-3 w-3" />
                        {viewingCard?.notes ? "Edit" : "Add Notes"}
                      </Button>
                    )}
                  </div>
                  <div className="p-4 min-h-[120px]">
                    {isEditingCardNotes ? (
                      <textarea
                        ref={cardNotesRef}
                        value={cardNotesValue}
                        onChange={(e) => setCardNotesValue(e.target.value)}
                        className="w-full min-h-[120px] resize-none bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-muted-foreground/50"
                        placeholder="Start typing notes..."
                      />
                    ) : viewingCard?.notes ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed cursor-pointer hover:bg-muted/30 rounded p-1 -m-1 transition-colors"
                        onClick={() => {
                          setCardNotesValue(viewingCard?.notes || "");
                          setIsEditingCardNotes(true);
                          setTimeout(() => cardNotesRef.current?.focus(), 50);
                        }}>
                        {viewingCard.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic cursor-pointer hover:bg-muted/30 rounded p-1 -m-1 transition-colors"
                        onClick={() => {
                          setCardNotesValue("");
                          setIsEditingCardNotes(true);
                          setTimeout(() => cardNotesRef.current?.focus(), 50);
                        }}>
                        Click to add notes...
                      </p>
                    )}
                  </div>
                </div>

                {/* Upload area */}
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">
                    <button className="text-primary underline" onClick={() => cardFileRef.current?.click()}>
                      Upload files
                    </button>{" "}(images, PDFs)
                  </p>
                  <input
                    ref={cardFileRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      if (!e.target.files) return;
                      setCardUploading(true);
                      for (const file of Array.from(e.target.files)) {
                        await uploadCardFile(viewingCard.id, file);
                      }
                      setCardUploading(false);
                      e.target.value = "";
                    }}
                  />
                  {cardUploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                </div>

                {/* Card files */}
                {viewingCard.files.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {viewingCard.files.map((file) => (
                      <Card key={file.id} className="overflow-hidden">
                        {file.fileType.startsWith("image/") && file.signedUrl ? (
                          <div className="h-40 bg-muted cursor-pointer relative group" onClick={() => setViewerImage(file.signedUrl!)}>
                            <img src={file.signedUrl} alt={file.fileName} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ) : file.fileType === "application/pdf" && file.signedUrl ? (
                          <div className="h-40 bg-muted flex items-center justify-center cursor-pointer relative group"
                            onClick={async () => {
                              setCardPdfLoading(true);
                              setCardPdfUrl(file.signedUrl!);
                              try {
                                const res = await fetch(file.signedUrl!);
                                const blob = await res.blob();
                                setCardPdfBlob(URL.createObjectURL(new Blob([blob], { type: "application/pdf" })));
                              } catch { setCardPdfBlob(null); }
                              setCardPdfLoading(false);
                            }}>
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
                          <p className="text-sm font-medium truncate flex-1 min-w-0">{file.fileName}</p>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => deleteCardFile(file.id, file.fileUrl)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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

      {/* Edit Card Dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-w-lg">
          {editingCard && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input value={editCardName} onChange={(e) => setEditCardName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={editCardDesc} onChange={(e) => setEditCardDesc(e.target.value)} rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium">Link</label>
                  <Input value={editCardLink} onChange={(e) => setEditCardLink(e.target.value)} placeholder="https://..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingCard(null)}>Cancel</Button>
                  <Button onClick={async () => {
                    await updateCard(editingCard.id, {
                      name: editCardName,
                      description: editCardDesc,
                      link: editCardLink || null,
                    });
                    setEditingCard(null);
                  }}>Save</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Card PDF Preview */}
      <Dialog open={!!cardPdfUrl} onOpenChange={(open) => {
        if (!open) {
          if (cardPdfBlob?.startsWith("blob:")) URL.revokeObjectURL(cardPdfBlob);
          setCardPdfUrl(null);
          setCardPdfBlob(null);
        }
      }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> PDF Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-4 pt-0">
            {cardPdfLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            ) : cardPdfBlob ? (
              <object data={cardPdfBlob} type="application/pdf" className="w-full h-full rounded border">
                <p className="text-sm text-muted-foreground text-center p-4">
                  Preview unavailable.{" "}
                  <a href={cardPdfUrl || "#"} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open PDF</a>
                </p>
              </object>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-destructive">Failed to load PDF</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
      <Dialog open={!!previewPdfUrl} onOpenChange={(open) => !open && closePreviewPdf()}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-4 pt-0">
            {pdfLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            ) : pdfBlobUrl ? (
              <object
                data={pdfBlobUrl}
                type="application/pdf"
                className="w-full h-full rounded border"
              >
                <div className="w-full h-full flex items-center justify-center text-center px-6">
                  <p className="text-sm text-muted-foreground">
                    Preview unavailable. {" "}
                    <a
                      href={previewPdfUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Open PDF
                    </a>
                  </p>
                </div>
              </object>
            ) : previewPdfUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-destructive">Failed to load PDF</p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
