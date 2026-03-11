import { useState } from "react";
import { useTodos, Todo } from "@/hooks/useTodos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Calendar,
  Pencil,
  Check,
  X,
  ChevronDown as ChevronDownIcon,
  ChevronRight,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";

export function TodoList() {
  const { todos, loading, addTodo, updateTodo, deleteTodo, reorderTodos } = useTodos();
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [showAddNotes, setShowAddNotes] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addTodo(newTitle.trim(), newDueDate || null, newNotes || null);
    setNewTitle("");
    setNewDueDate("");
    setNewNotes("");
    setShowAddNotes(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDueDate(todo.dueDate ? todo.dueDate.split("T")[0] : "");
    setEditNotes(todo.notes || "");
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    await updateTodo(editingId, {
      title: editTitle.trim(),
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      notes: editNotes || null,
    });
    setEditingId(null);
  };

  const moveItem = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= todos.length) return;
    const reordered = [...todos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    const updated = reordered.map((t, i) => ({ ...t, displayOrder: i }));
    await reorderTodos(updated);
  };

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const overdue = isPast(date) && !isToday(date);
    const today = isToday(date);

    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs shrink-0",
          overdue && "border-destructive text-destructive",
          today && "border-amber-500 text-amber-600 dark:text-amber-400",
          !overdue && !today && "text-muted-foreground"
        )}
      >
        <Calendar className="h-3 w-3 mr-1" />
        {format(date, "MMM d")}
      </Badge>
    );
  };

  const pendingTodos = todos.filter((t) => !t.isDone);
  const doneTodos = todos.filter((t) => t.isDone);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add new todo */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a to-do..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="w-40"
        />
        <Button onClick={handleAdd} size="icon" disabled={!newTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Pending todos */}
      {pendingTodos.length === 0 && doneTodos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No to-dos yet. Add one above!</p>
        </div>
      )}

      <div className="space-y-1">
        {pendingTodos.map((todo, idx) => {
          const originalIndex = todos.indexOf(todo);
          const isEditing = editingId === todo.id;

          return (
            <div
              key={todo.id}
              className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors group"
            >
              <Checkbox
                checked={todo.isDone}
                onCheckedChange={(checked) =>
                  updateTodo(todo.id, { isDone: !!checked })
                }
              />

              {isEditing ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    className="h-8 flex-1"
                    autoFocus
                  />
                  <Input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="h-8 w-36"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    className="flex-1 text-sm cursor-pointer"
                    onDoubleClick={() => startEdit(todo)}
                  >
                    {todo.title}
                  </span>
                  {getDueDateBadge(todo.dueDate)}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => startEdit(todo)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => moveItem(originalIndex, "up")}
                      disabled={originalIndex === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => moveItem(originalIndex, "down")}
                      disabled={originalIndex === todos.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Completed todos */}
      {doneTodos.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">
            Completed ({doneTodos.length})
          </p>
          {doneTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 group"
            >
              <Checkbox
                checked={todo.isDone}
                onCheckedChange={(checked) =>
                  updateTodo(todo.id, { isDone: !!checked })
                }
              />
              <span className="flex-1 text-sm line-through text-muted-foreground">
                {todo.title}
              </span>
              {getDueDateBadge(todo.dueDate)}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteTodo(todo.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
