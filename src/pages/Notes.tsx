import { useState, useRef, useMemo } from "react";
import { useNotes } from "@/hooks/useNotes";
import { useNoteTags } from "@/hooks/useNoteTags";
import { useNoteAttachments } from "@/hooks/useNoteAttachments";
import { useNotesAi } from "@/hooks/useNotesAi";
import { Note, NoteColor, NoteView } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodoList } from "@/components/TodoList";
import { HowToDoPage } from "@/components/HowToDoPage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Plus, StickyNote, Pin, PinOff, Trash2, MoreVertical, Search,
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Code, Minus,
  Palette, ListTodo, BookOpen, Tag, Archive, ArchiveRestore, Bell, BellOff,
  ImagePlus, X, FileText, Sparkles, Wand2, RotateCcw, Filter, CheckSquare,
  Download, Printer,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const COLOR_OPTIONS: { value: NoteColor; label: string; bg: string; border: string; dot: string }[] = [
  { value: "default", label: "Default", bg: "bg-card", border: "border-border", dot: "bg-muted-foreground" },
  { value: "red", label: "Red", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900", dot: "bg-red-500" },
  { value: "orange", label: "Orange", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-900", dot: "bg-orange-500" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-900", dot: "bg-yellow-500" },
  { value: "green", label: "Green", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900", dot: "bg-green-500" },
  { value: "blue", label: "Blue", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900", dot: "bg-blue-500" },
  { value: "purple", label: "Purple", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", dot: "bg-purple-500" },
  { value: "pink", label: "Pink", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-900", dot: "bg-pink-500" },
];

const getColorClasses = (color: NoteColor) => COLOR_OPTIONS.find((c) => c.value === color) || COLOR_OPTIONS[0];

export function Notes() {
  const {
    notes, loading, addNote, updateNote, deleteNote, togglePin,
    moveToTrash, restoreFromTrash, archive, unarchive, setNoteTags,
    bulkUpdate, bulkDelete,
  } = useNotes();
  const { tags, addTag, deleteTag } = useNoteTags();
  const { summarize, rewrite, loading: aiLoading } = useNotesAi();

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<NoteView>("active");
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState<NoteColor>("default");
  const [newReminderAt, setNewReminderAt] = useState("");
  const [newIsTemplate, setNewIsTemplate] = useState(false);
  const [newTagIds, setNewTagIds] = useState<string[]>([]);
  const editContentRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState("notes");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagsManagerOpen, setTagsManagerOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<NoteColor>("default");
  const [templateChooserOpen, setTemplateChooserOpen] = useState(false);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (view === "trash") {
        if (!n.deletedAt) return false;
      } else {
        if (n.deletedAt) return false;
      }
      if (view === "archived" && !n.archived) return false;
      if (view === "active" && (n.archived || n.isTemplate)) return false;
      if (view === "templates" && !n.isTemplate) return false;
      if (view === "reminders" && (!n.reminderAt || n.archived || n.isTemplate)) return false;
      if (filterTagIds.length > 0 && !filterTagIds.every((tid) => n.tagIds.includes(tid))) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const contentText = isHtmlContent(n.content) ? htmlToPlainText(n.content) : n.content;
        if (!n.title.toLowerCase().includes(q) && !contentText.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [notes, view, filterTagIds, searchQuery]);

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);
  const templates = notes.filter((n) => n.isTemplate && !n.deletedAt);

  const resetCreate = () => {
    setNewTitle(""); setNewContent(""); setNewColor("default");
    setNewReminderAt(""); setNewIsTemplate(false); setNewTagIds([]);
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    const created = await addNote({
      title: newTitle.trim(),
      content: newContent.trim(),
      color: newColor,
      isTemplate: newIsTemplate,
      reminderAt: newReminderAt ? new Date(newReminderAt).toISOString() : null,
    });
    if (created && newTagIds.length > 0) {
      await setNoteTags(created.id, newTagIds);
    }
    resetCreate();
    setIsCreating(false);
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    await updateNote(editingNote.id, {
      title: editingNote.title,
      content: editingNote.content,
      color: editingNote.color,
      reminderAt: editingNote.reminderAt,
      isTemplate: editingNote.isTemplate,
    });
    setEditingNote(null);
  };

  const handleDelete = async (note: Note) => {
    if (note.deletedAt) {
      if (confirm("Permanently delete this note?")) {
        await deleteNote(note.id);
        setEditingNote(null);
      }
    } else {
      await moveToTrash(note.id);
      toast.success("Moved to trash");
      setEditingNote(null);
    }
  };

  const useTemplate = (tpl: Note) => {
    setNewTitle(tpl.title);
    setNewContent(tpl.content);
    setNewColor(tpl.color);
    setNewTagIds(tpl.tagIds);
    setNewIsTemplate(false);
    setTemplateChooserOpen(false);
    setIsCreating(true);
  };

  // (markdown editor lives in MarkdownEditor component below)

  const ColorPicker = ({ value, onChange }: { value: NoteColor; onChange: (c: NoteColor) => void }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Palette className="h-4 w-4" /><span className={cn("h-3 w-3 rounded-full", getColorClasses(value).dot)} /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2"><div className="grid grid-cols-4 gap-1">
        {COLOR_OPTIONS.map((c) => (
          <button key={c.value} className={cn("h-8 w-8 rounded-full border-2", c.dot, value === c.value ? "border-foreground" : "border-transparent")} onClick={() => onChange(c.value)} title={c.label} />
        ))}
      </div></PopoverContent>
    </Popover>
  );

  const TagPicker = ({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Tag className="h-4 w-4" />{selected.length > 0 ? `${selected.length} tag${selected.length > 1 ? "s" : ""}` : "Tags"}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-72 overflow-y-auto">
        <DropdownMenuLabel>Tags</DropdownMenuLabel>
        {tags.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground text-center">No tags yet</div>}
        {tags.map((t) => (
          <DropdownMenuCheckboxItem key={t.id} checked={selected.includes(t.id)} onCheckedChange={(v) => { onChange(v ? [...selected, t.id] : selected.filter((x) => x !== t.id)); }} onSelect={(e) => e.preventDefault()}>
            <span className={cn("h-2 w-2 rounded-full mr-2", getColorClasses(t.color).dot)} />{t.name}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTagsManagerOpen(true)}><Plus className="h-4 w-4 mr-2" />Manage tags</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const NoteCardEl = ({ note }: { note: Note }) => {
    const colorClasses = getColorClasses(note.color);
    const isSelected = selectedIds.has(note.id);
    const noteTags = tags.filter((t) => note.tagIds.includes(t.id));
    return (
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow group relative",
          colorClasses.bg, colorClasses.border,
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => {
          if (selectedIds.size > 0) {
            const next = new Set(selectedIds);
            if (next.has(note.id)) next.delete(note.id); else next.add(note.id);
            setSelectedIds(next);
          } else {
            setEditingNote(note);
          }
        }}
      >
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} onCheckedChange={(v) => {
            const next = new Set(selectedIds);
            if (v) next.add(note.id); else next.delete(note.id);
            setSelectedIds(next);
          }} />
        </div>
        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 pl-9">
          <div className="flex-1 min-w-0">
            {note.title ? <h3 className="font-semibold text-base truncate">{note.title}</h3>
              : <h3 className="font-semibold text-base text-muted-foreground italic">Untitled</h3>}
          </div>
          <div className="flex items-center gap-1">
            {note.isPinned && <Pin className="h-4 w-4 text-primary" />}
            {note.reminderAt && <Bell className="h-4 w-4 text-amber-500" />}
            {note.isTemplate && <FileText className="h-4 w-4 text-blue-500" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {!note.deletedAt && (<>
                  <DropdownMenuItem onClick={() => togglePin(note.id)}>
                    {note.isPinned ? <><PinOff className="h-4 w-4 mr-2" />Unpin</> : <><Pin className="h-4 w-4 mr-2" />Pin</>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => note.archived ? unarchive(note.id) : archive(note.id)}>
                    {note.archived ? <><ArchiveRestore className="h-4 w-4 mr-2" />Unarchive</> : <><Archive className="h-4 w-4 mr-2" />Archive</>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>)}
                {note.deletedAt && (
                  <DropdownMenuItem onClick={() => restoreFromTrash(note.id)}><RotateCcw className="h-4 w-4 mr-2" />Restore</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDelete(note)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />{note.deletedAt ? "Delete forever" : "Move to trash"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pl-9">
          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{htmlToPlainText(note.content) || "No content"}</p>
          {noteTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {noteTags.map((t) => (
                <Badge key={t.id} variant="secondary" className="text-xs">
                  <span className={cn("h-1.5 w-1.5 rounded-full mr-1", getColorClasses(t.color).dot)} />{t.name}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            {note.reminderAt && <span className="text-amber-600 dark:text-amber-400">Reminder {format(new Date(note.reminderAt), "MMM d, h:mm a")} · </span>}
            {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </CardContent>
      </Card>
    );
  };

  const selectedArr = Array.from(selectedIds);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><StickyNote className="h-6 w-6" />Notes</h1>
          <p className="text-muted-foreground">Capture ideas, lists, reminders and more</p>
        </div>
      </div>

      <Tabs defaultValue="notes" className="w-full" onValueChange={(v) => setActiveTab(v)}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="notes" className="gap-2"><StickyNote className="h-4 w-4" />Notes</TabsTrigger>
            <TabsTrigger value="todos" className="gap-2"><ListTodo className="h-4 w-4" />To-Do</TabsTrigger>
            <TabsTrigger value="howto" className="gap-2"><BookOpen className="h-4 w-4" />How To Do</TabsTrigger>
          </TabsList>
          {activeTab === "notes" && (
            <div className="flex gap-2">
              {templates.length > 0 && (
                <Button variant="outline" onClick={() => setTemplateChooserOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" />Templates
                </Button>
              )}
              <Button onClick={() => setIsCreating(true)} className="shrink-0"><Plus className="h-4 w-4 mr-2" />New Note</Button>
            </div>
          )}
        </div>

        <TabsContent value="todos" className="mt-4"><TodoList /></TabsContent>
        <TabsContent value="howto" className="mt-4"><HowToDoPage /></TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          {/* View tabs + filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={view} onValueChange={(v) => { setView(v as NoteView); setSelectedIds(new Set()); }}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="reminders" className="gap-1"><Bell className="h-3.5 w-3.5" />Reminders</TabsTrigger>
                <TabsTrigger value="archived" className="gap-1"><Archive className="h-3.5 w-3.5" />Archive</TabsTrigger>
                <TabsTrigger value="templates" className="gap-1"><FileText className="h-3.5 w-3.5" />Templates</TabsTrigger>
                <TabsTrigger value="trash" className="gap-1"><Trash2 className="h-3.5 w-3.5" />Trash</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" />Tags{filterTagIds.length > 0 && ` (${filterTagIds.length})`}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-72 overflow-y-auto">
                <DropdownMenuLabel>Filter by tag</DropdownMenuLabel>
                {tags.length === 0 && <div className="px-2 py-3 text-xs text-muted-foreground text-center">No tags yet</div>}
                {tags.map((t) => (
                  <DropdownMenuCheckboxItem key={t.id} checked={filterTagIds.includes(t.id)} onCheckedChange={(v) => setFilterTagIds(v ? [...filterTagIds, t.id] : filterTagIds.filter((x) => x !== t.id))} onSelect={(e) => e.preventDefault()}>
                    <span className={cn("h-2 w-2 rounded-full mr-2", getColorClasses(t.color).dot)} />{t.name}
                  </DropdownMenuCheckboxItem>
                ))}
                {filterTagIds.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setFilterTagIds([])}>Clear filters</DropdownMenuItem></>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTagsManagerOpen(true)}><Plus className="h-4 w-4 mr-2" />Manage tags</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-md">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={async () => { await bulkUpdate(selectedArr, { isPinned: true }); setSelectedIds(new Set()); }}><Pin className="h-4 w-4 mr-1" />Pin</Button>
              <Button size="sm" variant="outline" onClick={async () => { await bulkUpdate(selectedArr, { archived: true }); setSelectedIds(new Set()); toast.success("Archived"); }}><Archive className="h-4 w-4 mr-1" />Archive</Button>
              <Popover>
                <PopoverTrigger asChild><Button size="sm" variant="outline"><Palette className="h-4 w-4 mr-1" />Color</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-2"><div className="grid grid-cols-4 gap-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c.value} className={cn("h-8 w-8 rounded-full border-2 border-transparent", c.dot)} onClick={async () => { await bulkUpdate(selectedArr, { color: c.value }); setSelectedIds(new Set()); }} />
                  ))}
                </div></PopoverContent>
              </Popover>
              {view === "trash" ? (
                <Button size="sm" variant="destructive" onClick={async () => {
                  if (confirm(`Permanently delete ${selectedIds.size} notes?`)) { await bulkDelete(selectedArr); setSelectedIds(new Set()); }
                }}><Trash2 className="h-4 w-4 mr-1" />Delete forever</Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={async () => { await bulkUpdate(selectedArr, { deletedAt: new Date().toISOString() }); setSelectedIds(new Set()); toast.success("Moved to trash"); }}><Trash2 className="h-4 w-4 mr-1" />Trash</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4" /></Button>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          {/* Notes Grid */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No notes here</h3>
              <p className="text-muted-foreground">{searchQuery ? "Try a different search" : "Create your first note to get started"}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pinnedNotes.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"><Pin className="h-4 w-4" />Pinned</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {pinnedNotes.map((note) => <NoteCardEl key={note.id} note={note} />)}
                  </div>
                </div>
              )}
              {unpinnedNotes.length > 0 && (
                <div>
                  {pinnedNotes.length > 0 && <h2 className="text-sm font-medium text-muted-foreground mb-3">Others</h2>}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {unpinnedNotes.map((note) => <NoteCardEl key={note.id} note={note} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Note Dialog */}
      <Dialog open={isCreating} onOpenChange={(o) => { if (!o) resetCreate(); setIsCreating(o); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Note</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="text-lg font-semibold" />
            <MarkdownEditor value={newContent} onChange={setNewContent} placeholder="Write your note..." className="min-h-[200px]" />
            <div className="flex flex-wrap gap-2 items-center">
              <ColorPicker value={newColor} onChange={setNewColor} />
              <TagPicker selected={newTagIds} onChange={setNewTagIds} />
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Input type="datetime-local" value={newReminderAt} onChange={(e) => setNewReminderAt(e.target.value)} className="w-auto" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={newIsTemplate} onCheckedChange={(v) => setNewIsTemplate(!!v)} />
                Save as template
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { resetCreate(); setIsCreating(false); }}>Cancel</Button>
              <Button onClick={handleCreateNote}>Create Note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && handleUpdateNote()}>
        <DialogContent className="max-w-none w-screen h-screen m-0 p-6 rounded-none flex flex-col" onOpenAutoFocus={(e) => {
          e.preventDefault();
          setTimeout(() => editContentRef.current?.focus(), 0);
        }}>
          <DialogHeader><DialogTitle>Edit Note</DialogTitle></DialogHeader>
          {editingNote && <EditNoteBody
            note={editingNote}
            onChange={setEditingNote}
            onClose={handleUpdateNote}
            onDelete={() => handleDelete(editingNote)}
            onPin={() => togglePin(editingNote.id)}
            onArchive={() => editingNote.archived ? unarchive(editingNote.id) : archive(editingNote.id)}
            tags={tags}
            setNoteTags={setNoteTags}
            colorPicker={<ColorPicker value={editingNote.color} onChange={(c) => setEditingNote({ ...editingNote, color: c })} />}
            tagPicker={<TagPicker selected={editingNote.tagIds} onChange={(ids) => { setEditingNote({ ...editingNote, tagIds: ids }); setNoteTags(editingNote.id, ids); }} />}
            editContentRef={editContentRef}
            summarize={summarize}
            rewrite={rewrite}
            aiLoading={aiLoading}
          />}
        </DialogContent>
      </Dialog>

      {/* Tags Manager */}
      <Dialog open={tagsManagerOpen} onOpenChange={setTagsManagerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Tags</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="New tag name" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={async (e) => {
                if (e.key === "Enter" && newTagName.trim()) { await addTag(newTagName, newTagColor); setNewTagName(""); }
              }} />
              <ColorPicker value={newTagColor} onChange={setNewTagColor} />
              <Button onClick={async () => { if (newTagName.trim()) { await addTag(newTagName, newTagColor); setNewTagName(""); } }}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {tags.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tags yet</p>}
              {tags.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-full", getColorClasses(t.color).dot)} />
                    <span className="text-sm">{t.name}</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteTag(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter><Button onClick={() => setTagsManagerOpen(false)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Chooser */}
      <Dialog open={templateChooserOpen} onOpenChange={setTemplateChooserOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Choose Template</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No templates yet. Save a note as a template to reuse it.</p>
            ) : templates.map((t) => (
              <button key={t.id} className="w-full text-left p-3 rounded border hover:bg-muted transition-colors" onClick={() => useTemplate(t)}>
                <div className="font-medium">{t.title || "Untitled template"}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.content}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function downloadNote(note: Note) {
  const safeTitle = (note.title || 'note').replace(/[^a-z0-9-_ ]/gi, '_').slice(0, 80) || 'note';
  const plainContent = isHtmlContent(note.content || '') ? htmlToPlainText(note.content || '') : (note.content || '');
  const body = `${note.title || 'Untitled'}\n${'='.repeat((note.title || 'Untitled').length)}\n\n${plainContent}\n`;
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function printNote(note: Note) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) {
    toast.error('Pop-up blocked. Allow pop-ups to print.');
    return;
  }
  const title = escapeHtml(note.title || 'Untitled');
  const rawContent = note.content || '';
  // If the content is HTML (from the rich editor) render it directly; otherwise
  // fall back to the legacy plain-text <pre> rendering.
  const contentBlock = isHtmlContent(rawContent)
    ? `<div class="content">${rawContent}</div>`
    : `<pre>${escapeHtml(rawContent)}</pre>`;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #111; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 24px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 16px; }
  pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 14px; line-height: 1.6; }
  .content { font-size: 14px; line-height: 1.6; }
  .content h1 { font-size: 22px; border: 0; padding: 0; margin: 12px 0 6px; }
  .content h2 { font-size: 18px; margin: 10px 0 6px; }
  .content ul, .content ol { padding-left: 24px; }
  .content blockquote { border-left: 4px solid #ddd; padding-left: 10px; color: #555; font-style: italic; margin: 8px 0; }
  .content pre { background: #f4f4f4; padding: 8px; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 12px; }
  .content hr { border: 0; border-top: 1px solid #ddd; margin: 12px 0; }
  @media print { body { padding: 0; } }
</style></head><body><h1>${title}</h1>${contentBlock}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 100); };</script>
</body></html>`);
  w.document.close();
}

// Separate component to keep editor logic isolated
function EditNoteBody(props: any) {
  const {
    note, onChange, onClose, onDelete, onPin, onArchive,
    colorPicker, tagPicker, editContentRef,
    summarize, rewrite, aiLoading,
  } = props;
  const { attachments, uploadAttachment, deleteAttachment } = useNoteAttachments(note.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plainContentForCount = htmlToPlainText(note.content || "");
  const wordCount = plainContentForCount.trim().split(/\s+/).filter(Boolean).length;
  const charCount = plainContentForCount.length;

  const reminderLocal = note.reminderAt ? new Date(note.reminderAt).toISOString().slice(0, 16) : "";

  const onAi = async (kind: "summarize" | "rewrite") => {
    const fn = kind === "summarize" ? summarize : rewrite;
    const result = await fn(note.title, note.content);
    if (result) {
      if (kind === "summarize") {
        onChange({ ...note, content: `## Summary\n\n${result}\n\n---\n\n${note.content}` });
        toast.success("Summary added at top");
      } else {
        onChange({ ...note, content: result });
        toast.success("Rewritten");
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <Input placeholder="Title" value={note.title} onChange={(e) => onChange({ ...note, title: e.target.value })} className="text-lg font-semibold" />

      <div className="flex flex-wrap gap-2 items-center">
        {colorPicker}
        {tagPicker}
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Input type="datetime-local" value={reminderLocal} onChange={(e) => onChange({ ...note, reminderAt: e.target.value ? new Date(e.target.value).toISOString() : null })} className="w-auto" />
          {note.reminderAt && <Button size="icon" variant="ghost" onClick={() => onChange({ ...note, reminderAt: null })}><BellOff className="h-4 w-4" /></Button>}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={note.isTemplate} onCheckedChange={(v) => onChange({ ...note, isTemplate: !!v })} />
          Template
        </label>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><ImagePlus className="h-4 w-4 mr-1" />Add image</Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (f) await uploadAttachment(f); if (fileInputRef.current) fileInputRef.current.value = "";
        }} />
        <Button size="sm" variant="outline" onClick={() => onAi("summarize")} disabled={aiLoading !== null}><Sparkles className="h-4 w-4 mr-1" />{aiLoading === "summarize" ? "..." : "Summarize"}</Button>
        <Button size="sm" variant="outline" onClick={() => onAi("rewrite")} disabled={aiLoading !== null}><Wand2 className="h-4 w-4 mr-1" />{aiLoading === "rewrite" ? "..." : "Rewrite"}</Button>
        <Button size="sm" variant="outline" onClick={() => downloadNote(note)}><Download className="h-4 w-4 mr-1" />Download</Button>
        <Button size="sm" variant="outline" onClick={() => printNote(note)}><Printer className="h-4 w-4 mr-1" />Print</Button>
        <Button size="sm" variant="outline" onClick={onPin}>{note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}</Button>
        <Button size="sm" variant="outline" onClick={onArchive}>{note.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>
        <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </div>

      <MarkdownEditor
        value={note.content}
        onChange={(v) => onChange({ ...note, content: v })}
        placeholder="Write your note..."
        className="flex-1 min-h-0"
      />

      {attachments.length > 0 && (
        <div className="border rounded-md p-3">
          <h4 className="text-sm font-medium mb-2">Images ({attachments.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {attachments.map((a: any) => (
              <div key={a.id} className="relative group aspect-square rounded overflow-hidden border bg-muted">
                {a.signedUrl && <img src={a.signedUrl} alt={a.fileName} className="w-full h-full object-cover" />}
                <button onClick={() => deleteAttachment(a.id)} className="absolute top-1 right-1 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{wordCount} words · {charCount} characters</span>
        <Button size="sm" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

// ============================================================
// RichTextEditor — true WYSIWYG editor (contentEditable + execCommand).
// Bold/Italic/etc actually format the text visually. Stored as HTML.
// Backward compatible: plain-text/markdown content is auto-displayed as text.
// ============================================================

// Detect whether a stored note value is HTML (from this editor) or legacy plain text.
function isHtmlContent(s: string): boolean {
  if (!s) return false;
  return /<\/?(p|div|br|span|strong|em|u|h[1-6]|ul|ol|li|blockquote|pre|code|hr)\b/i.test(s);
}

// Convert legacy plain text (with optional markdown markers) to safe HTML for the editor.
function plainTextToHtml(s: string): string {
  if (!s) return "";
  const escaped = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// Strip HTML tags to get plain text (for previews, downloads, search).
function htmlToPlainText(s: string): string {
  if (!s) return "";
  if (!isHtmlContent(s)) return s;
  const tmp = document.createElement("div");
  tmp.innerHTML = s;
  return tmp.innerText || tmp.textContent || "";
}

function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string>("");
  const [, forceUpdate] = useState(0);

  // Initialize / sync external value into the contentEditable only when it
  // differs from what we last emitted (avoids caret jumps while typing).
  useMemo(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastValueRef.current) {
      const html = isHtmlContent(value) ? value : plainTextToHtml(value);
      if (el.innerHTML !== html) el.innerHTML = html;
      lastValueRef.current = value;
    }
  }, [value]);

  // After mount, populate initial HTML.
  const setRef = (el: HTMLDivElement | null) => {
    editorRef.current = el;
    if (el && el.innerHTML === "") {
      const html = isHtmlContent(value) ? value : plainTextToHtml(value);
      el.innerHTML = html;
      lastValueRef.current = value;
    }
  };

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  };

  const exec = (command: string, arg?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    // execCommand is deprecated but still universally supported and is the
    // simplest way to get true WYSIWYG formatting in a contentEditable.
    document.execCommand(command, false, arg);
    emit();
    forceUpdate((n) => n + 1); // refresh active button states
  };

  const isActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const isBlock = (tag: string): boolean => {
    try {
      return document.queryCommandValue("formatBlock").toLowerCase() === tag.toLowerCase();
    } catch {
      return false;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Paste as plain text to avoid pulling in foreign styles/images.
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    emit();
  };

  const ToolBtn = ({
    active, onClick, title, children,
  }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 w-8 p-0",
        active && "bg-accent text-accent-foreground ring-1 ring-ring"
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("border rounded-md overflow-hidden flex flex-col", className)}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <ToolBtn active={isActive("bold")} onClick={() => exec("bold")} title="Bold"><Bold className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={isActive("italic")} onClick={() => exec("italic")} title="Italic"><Italic className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolBtn active={isBlock("h1")} onClick={() => exec("formatBlock", "H1")} title="Heading 1"><Heading1 className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={isBlock("h2")} onClick={() => exec("formatBlock", "H2")} title="Heading 2"><Heading2 className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolBtn active={isActive("insertUnorderedList")} onClick={() => exec("insertUnorderedList")} title="Bullet list"><List className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={isActive("insertOrderedList")} onClick={() => exec("insertOrderedList")} title="Numbered list"><ListOrdered className="h-4 w-4" /></ToolBtn>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolBtn active={isBlock("blockquote")} onClick={() => exec("formatBlock", "BLOCKQUOTE")} title="Quote"><Quote className="h-4 w-4" /></ToolBtn>
        <ToolBtn active={isBlock("pre")} onClick={() => exec("formatBlock", "PRE")} title="Code block"><Code className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Divider"><Minus className="h-4 w-4" /></ToolBtn>
      </div>
      <div
        ref={setRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onPaste={handlePaste}
        onKeyUp={() => forceUpdate((n) => n + 1)}
        onMouseUp={() => forceUpdate((n) => n + 1)}
        data-placeholder={placeholder}
        className={cn(
          "flex-1 px-3 py-2 outline-none overflow-auto text-sm",
          "prose prose-sm dark:prose-invert max-w-none",
          "[&[data-placeholder]:empty]:before:content-[attr(data-placeholder)]",
          "[&:empty]:before:text-muted-foreground [&:empty]:before:pointer-events-none",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-2",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_pre]:bg-muted [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs",
          "[&_hr]:my-3 [&_hr]:border-border"
        )}
      />
    </div>
  );
}
