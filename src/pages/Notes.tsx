import { useState, useRef } from "react";
import { useNotes } from "@/hooks/useNotes";
import { Note, NoteColor } from "@/types/note";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodoList } from "@/components/TodoList";
import { HowToDoPage } from "@/components/HowToDoPage";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  Plus,
  StickyNote,
  Pin,
  PinOff,
  Trash2,
  MoreVertical,
  Search,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Minus,
  Palette,
  ListTodo,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";

const COLOR_OPTIONS: { value: NoteColor; label: string; bg: string; border: string }[] = [
  { value: "default", label: "Default", bg: "bg-card", border: "border-border" },
  { value: "red", label: "Red", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900" },
  { value: "orange", label: "Orange", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-900" },
  { value: "yellow", label: "Yellow", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-900" },
  { value: "green", label: "Green", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900" },
  { value: "blue", label: "Blue", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900" },
  { value: "purple", label: "Purple", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900" },
  { value: "pink", label: "Pink", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-900" },
];

const getColorClasses = (color: NoteColor) => {
  return COLOR_OPTIONS.find((c) => c.value === color) || COLOR_OPTIONS[0];
};

export function Notes() {
  const { notes, loading, addNote, updateNote, deleteNote, togglePin } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState<NoteColor>("default");
  const editContentRef = useRef<HTMLTextAreaElement>(null);

  // Filter notes by search
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  const handleCreateNote = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;

    await addNote({
      title: newTitle.trim(),
      content: newContent.trim(),
      color: newColor,
    });

    setNewTitle("");
    setNewContent("");
    setNewColor("default");
    setIsCreating(false);
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    await updateNote(editingNote.id, {
      title: editingNote.title,
      content: editingNote.content,
      color: editingNote.color,
    });

    setEditingNote(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this note?")) {
      await deleteNote(id);
      setEditingNote(null);
    }
  };

  const insertFormatting = (
    format: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    currentValue: string
  ) => {
    const formats: Record<string, string> = {
      bold: "**bold text**",
      italic: "*italic text*",
      h1: "\n# Heading 1\n",
      h2: "\n## Heading 2\n",
      ul: "\n- List item\n- List item\n",
      ol: "\n1. First item\n2. Second item\n",
      quote: "\n> Quote\n",
      code: "\n```\ncode block\n```\n",
      hr: "\n---\n",
    };
    setter(currentValue + formats[format]);
  };

  const FormatToolbar = ({
    onFormat,
    currentValue,
    setter,
  }: {
    onFormat: (fmt: string) => void;
    currentValue: string;
    setter: React.Dispatch<React.SetStateAction<string>>;
  }) => (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("bold", setter, currentValue)}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("italic", setter, currentValue)}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("h1", setter, currentValue)}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("h2", setter, currentValue)}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("ul", setter, currentValue)}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("ol", setter, currentValue)}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("quote", setter, currentValue)}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("code", setter, currentValue)}
        title="Code Block"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => insertFormatting("hr", setter, currentValue)}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );

  const NoteCard = ({ note }: { note: Note }) => {
    const colorClasses = getColorClasses(note.color);

    return (
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow group",
          colorClasses.bg,
          colorClasses.border
        )}
        onClick={() => setEditingNote(note)}
      >
        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="flex-1 min-w-0">
            {note.title ? (
              <h3 className="font-semibold text-base truncate">{note.title}</h3>
            ) : (
              <h3 className="font-semibold text-base text-muted-foreground italic">
                Untitled
              </h3>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {note.isPinned && <Pin className="h-4 w-4 text-primary" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(note.id);
                  }}
                >
                  {note.isPinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(note.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
            {note.content || "No content"}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <StickyNote className="h-6 w-6" />
            Notes
          </h1>
          <p className="text-muted-foreground">
            Capture ideas, lists, and more
          </p>
        </div>
      </div>

      <Tabs defaultValue="notes" className="w-full" onValueChange={(v) => setActiveTab(v)}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="notes" className="gap-2">
              <StickyNote className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="todos" className="gap-2">
              <ListTodo className="h-4 w-4" />
              To-Do
            </TabsTrigger>
            <TabsTrigger value="howto" className="gap-2">
              <BookOpen className="h-4 w-4" />
              How To Do
            </TabsTrigger>
          </TabsList>
          {activeTab === "notes" && (
            <Button onClick={() => setIsCreating(true)} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          )}
        </div>

        <TabsContent value="todos" className="mt-4">
          <TodoList />
        </TabsContent>

        <TabsContent value="howto" className="mt-4">
          <HowToDoPage />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No notes yet</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search" : "Create your first note to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pinnedNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}

          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  Others
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {unpinnedNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
        </TabsContent>
      </Tabs>

      {/* Create Note Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-lg font-semibold"
            />
            <div className="border rounded-md overflow-hidden">
              <FormatToolbar
                onFormat={(fmt) => insertFormatting(fmt, setNewContent, newContent)}
                currentValue={newContent}
                setter={setNewContent}
              />
              <Textarea
                placeholder="Write your note..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="min-h-[200px] border-0 focus-visible:ring-0 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
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
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              <Input
                placeholder="Title"
                value={editingNote.title}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, title: e.target.value })
                }
                className="text-lg font-semibold"
              />
              <div className="border rounded-md overflow-hidden flex-1 flex flex-col min-h-0">
                <FormatToolbar
                  onFormat={(fmt) =>
                    insertFormatting(
                      fmt,
                      (v) =>
                        setEditingNote({
                          ...editingNote,
                          content: typeof v === "function" ? v(editingNote.content) : v,
                        }),
                      editingNote.content
                    )
                  }
                  currentValue={editingNote.content}
                  setter={(v) =>
                    setEditingNote({
                      ...editingNote,
                      content: typeof v === "function" ? v(editingNote.content) : v,
                    })
                  }
                />
                <Textarea
                  ref={editContentRef}
                  placeholder="Write your note..."
                  value={editingNote.content}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, content: e.target.value })
                  }
                  className="flex-1 min-h-0 border-0 focus-visible:ring-0 resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePin(editingNote.id)}
                >
                  {editingNote.isPinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin
                    </>
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(editingNote.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button onClick={handleUpdateNote}>Save</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
