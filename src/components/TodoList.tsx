import { useState } from "react";
import { useTodos, Todo, AmountUnit } from "@/hooks/useTodos";
import { useRequests } from "@/hooks/useRequests";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  ShoppingCart,
  Link2,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


export function TodoList() {
  const { todos, loading, addTodo, updateTodo, deleteTodo, reorderTodos } = useTodos();
  const { requests } = useRequests();
  const { orders } = usePurchaseOrders();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newRequestId, setNewRequestId] = useState<string>("");
  const [newPurchaseOrderId, setNewPurchaseOrderId] = useState<string>("");
  const [newKgAmount, setNewKgAmount] = useState<string>("");
  const [newAmountUnit, setNewAmountUnit] = useState<AmountUnit>("kg");
  const [newPriorityNumber, setNewPriorityNumber] = useState<string>("");
  const [newPriorityGroup, setNewPriorityGroup] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editRequestId, setEditRequestId] = useState<string>("");
  const [editPurchaseOrderId, setEditPurchaseOrderId] = useState<string>("");
  const [editKgAmount, setEditKgAmount] = useState<string>("");
  const [editAmountUnit, setEditAmountUnit] = useState<AmountUnit>("kg");
  const [editPriorityNumber, setEditPriorityNumber] = useState<string>("");
  const [editPriorityGroup, setEditPriorityGroup] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addTodo(
      newTitle.trim(),
      newDueDate || null,
      newNotes || null,
      newRequestId || null,
      newPurchaseOrderId || null,
      newKgAmount ? parseFloat(newKgAmount) : 0,
      newPriorityNumber ? parseInt(newPriorityNumber, 10) : null,
      (newPriorityGroup as any) || null,
      newAmountUnit,
    );
    setNewTitle("");
    setNewDueDate("");
    setNewNotes("");
    setNewRequestId("");
    setNewPurchaseOrderId("");
    setNewKgAmount("");
    setNewAmountUnit("kg");
    setNewPriorityNumber("");
    setNewPriorityGroup("");
    setAddDialogOpen(false);
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDueDate(todo.dueDate ? todo.dueDate.split("T")[0] : "");
    setEditNotes(todo.notes || "");
    setEditRequestId(todo.requestId || "");
    setEditPurchaseOrderId(todo.purchaseOrderId || "");
    setEditKgAmount(todo.kgAmount ? String(todo.kgAmount) : "");
    setEditPriorityNumber(todo.priorityNumber ? String(todo.priorityNumber) : "");
    setEditPriorityGroup(todo.priorityGroup || "");
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    await updateTodo(editingId, {
      title: editTitle.trim(),
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      notes: editNotes || null,
      requestId: editRequestId || null,
      purchaseOrderId: editPurchaseOrderId || null,
      kgAmount: editKgAmount ? parseFloat(editKgAmount) : 0,
      priorityNumber: editPriorityNumber ? parseInt(editPriorityNumber, 10) : null,
      priorityGroup: (editPriorityGroup as any) || null,
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

  const getLinkedBadges = (todo: Todo) => {
    const badges: React.ReactNode[] = [];

    // Show kg amount if set
    if (todo.kgAmount > 0) {
      badges.push(
        <Badge
          key="kg"
          variant="outline"
          className="text-xs shrink-0 border-primary/30 text-primary"
        >
          {todo.kgAmount} kg
        </Badge>
      );
    }

    if (todo.requestId) {
      const req = requests.find((r) => r.id === todo.requestId);
      badges.push(
        <Badge
          key="req"
          variant="outline"
          className="text-xs shrink-0 cursor-pointer hover:bg-accent border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/requests/view/${req?.requestNumber || todo.requestId}`);
          }}
        >
          <FileText className="h-3 w-3 mr-1" />
          {req?.requestNumber || "Request"}
        </Badge>
      );
    }

    if (todo.purchaseOrderId) {
      const po = orders.find((o) => o.id === todo.purchaseOrderId);
      badges.push(
        <Badge
          key="po"
          variant="outline"
          className="text-xs shrink-0 cursor-pointer hover:bg-accent border-green-300 dark:border-green-700 text-green-600 dark:text-green-400"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/purchase-orders`);
          }}
        >
          <ShoppingCart className="h-3 w-3 mr-1" />
          {po?.poNumber || "PO"}
        </Badge>
      );
    }

    return badges;
  };

  const LinkSelectors = ({
    requestId,
    setRequestId,
    purchaseOrderId,
    setPurchaseOrderId,
  }: {
    requestId: string;
    setRequestId: (v: string) => void;
    purchaseOrderId: string;
    setPurchaseOrderId: (v: string) => void;
  }) => (
    <div className="flex gap-2 flex-wrap">
      <Select value={requestId} onValueChange={setRequestId}>
        <SelectTrigger className="h-8 w-48 text-xs">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <SelectValue placeholder="Link Request..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Request</SelectItem>
          {requests.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.requestNumber} — {r.itemName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={purchaseOrderId} onValueChange={setPurchaseOrderId}>
        <SelectTrigger className="h-8 w-48 text-xs">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            <SelectValue placeholder="Link PO..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No PO</SelectItem>
          {orders.map((o) => {
            const firstItem = Array.isArray(o.items) && o.items.length > 0 ? (o.items[0] as any)?.itemName : "";
            return (
              <SelectItem key={o.id} value={o.id}>
                {o.poNumber} — {firstItem || "PO"}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );

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
      {/* Add new todo trigger */}
      <div className="flex justify-end">
        <Button onClick={() => setAddDialogOpen(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          New To-Do
        </Button>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-none w-screen h-screen sm:rounded-none p-0 flex flex-col gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Create New To-Do</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (kg)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newKgAmount}
                    onChange={(e) => setNewKgAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority # (1 = first)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={newPriorityNumber}
                    onChange={(e) => setNewPriorityNumber(e.target.value)}
                    placeholder="Priority order"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority group</Label>
                  <Select
                    value={newPriorityGroup || "none"}
                    onValueChange={(v) => setNewPriorityGroup(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="soon">Soon</SelectItem>
                      <SelectItem value="eventually">Eventually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add notes (optional)..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Links</Label>
                <LinkSelectors
                  requestId={newRequestId}
                  setRequestId={(v) => setNewRequestId(v === "none" ? "" : v)}
                  purchaseOrderId={newPurchaseOrderId}
                  setPurchaseOrderId={(v) => setNewPurchaseOrderId(v === "none" ? "" : v)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!newTitle.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Create To-Do
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Pending todos */}
      {pendingTodos.length === 0 && doneTodos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No to-dos yet. Add one above!</p>
        </div>
      )}

      {(() => {
        const groupMeta: Record<string, { label: string; className: string }> = {
          urgent: { label: "Urgent", className: "bg-destructive/15 text-destructive border-destructive/30" },
          soon: { label: "Soon", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
          eventually: { label: "Eventually", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
          none: { label: "No priority group", className: "bg-muted text-muted-foreground border-border" },
        };
        const groupOrder: Array<'urgent' | 'soon' | 'eventually' | 'none'> = ["urgent", "soon", "eventually", "none"];
        const buckets: Record<string, Todo[]> = { urgent: [], soon: [], eventually: [], none: [] };
        for (const t of pendingTodos) buckets[t.priorityGroup || "none"].push(t);
        for (const k of Object.keys(buckets)) {
          buckets[k].sort((a, b) => {
            const an = a.priorityNumber ?? Number.POSITIVE_INFINITY;
            const bn = b.priorityNumber ?? Number.POSITIVE_INFINITY;
            if (an !== bn) return an - bn;
            return a.displayOrder - b.displayOrder;
          });
        }

        const renderRow = (todo: Todo, itemNumber: number) => {
          const originalIndex = todos.indexOf(todo);
          const isEditing = editingId === todo.id;
          const isExpanded = expandedId === todo.id;
          const linkedBadges = getLinkedBadges(todo);

          return (
            <div
              key={todo.id}
              className="flex flex-col gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-6 text-center">
                  {todo.priorityNumber ?? itemNumber}.
                </span>
                <Checkbox
                  checked={todo.isDone}
                  onCheckedChange={(checked) => updateTodo(todo.id, { isDone: !!checked })}
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
                    <span className="flex-1 text-sm cursor-pointer" onDoubleClick={() => startEdit(todo)}>
                      {todo.title}
                    </span>
                    {linkedBadges}
                    {getDueDateBadge(todo.dueDate)}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpandedId(isExpanded ? null : todo.id)} title={isExpanded ? "Hide details" : "Show details"}>
                        {isExpanded ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(todo)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveItem(originalIndex, "up")} disabled={originalIndex === 0}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveItem(originalIndex, "down")} disabled={originalIndex === todos.length - 1}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteTodo(todo.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {isExpanded && !isEditing && (
                <div className="ml-12 space-y-1">
                  {todo.notes && (
                    <div className="text-sm text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
                      {todo.notes}
                    </div>
                  )}
                </div>
              )}

              {isEditing && (
                <div className="ml-12 space-y-2">
                  <Textarea
                    placeholder="Add notes..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex gap-2 flex-wrap items-center">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editKgAmount}
                      onChange={(e) => setEditKgAmount(e.target.value)}
                      placeholder="Amount (kg)..."
                      className="h-8 w-32 text-sm"
                    />
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={editPriorityNumber}
                      onChange={(e) => setEditPriorityNumber(e.target.value)}
                      placeholder="Priority # (1=first)"
                      className="h-8 w-40 text-sm"
                    />
                    <Select value={editPriorityGroup || "none"} onValueChange={(v) => setEditPriorityGroup(v === "none" ? "" : v)}>
                      <SelectTrigger className="h-8 w-36 text-sm">
                        <SelectValue placeholder="Priority group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No group</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="soon">Soon</SelectItem>
                        <SelectItem value="eventually">Eventually</SelectItem>
                      </SelectContent>
                    </Select>
                    <LinkSelectors
                      requestId={editRequestId}
                      setRequestId={(v) => setEditRequestId(v === "none" ? "" : v)}
                      purchaseOrderId={editPurchaseOrderId}
                      setPurchaseOrderId={(v) => setEditPurchaseOrderId(v === "none" ? "" : v)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        };

        return (
          <div className="space-y-4">
            {groupOrder.map((g) => {
              const items = buckets[g];
              if (items.length === 0) return null;
              const meta = groupMeta[g];
              return (
                <div key={g} className="space-y-1">
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className={cn("text-xs", meta.className)}>
                      {meta.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((t, i) => renderRow(t, i + 1))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Completed todos grouped by year > month */}
      {doneTodos.length > 0 && (() => {
        // Group by year then month using updatedAt
        const byYear = new Map<string, Map<string, Todo[]>>();
        for (const t of doneTodos) {
          const d = new Date(t.updatedAt);
          const yearKey = format(d, "yyyy");
          const monthKey = format(d, "yyyy-MM");
          if (!byYear.has(yearKey)) byYear.set(yearKey, new Map());
          const yearMap = byYear.get(yearKey)!;
          if (!yearMap.has(monthKey)) yearMap.set(monthKey, []);
          yearMap.get(monthKey)!.push(t);
        }
        const sortedYears = Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0]));
        const currentYear = format(new Date(), "yyyy");
        const currentMonth = format(new Date(), "yyyy-MM");

        const renderTodo = (todo: Todo, idx: number) => {
          const isExpanded = expandedId === todo.id;
          const linkedBadges = getLinkedBadges(todo);
          return (
            <div
              key={todo.id}
              className="flex flex-col gap-2 p-2 rounded-md border bg-muted/30 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-5 text-center opacity-50">
                  {idx + 1}.
                </span>
                <Checkbox
                  checked={todo.isDone}
                  onCheckedChange={(checked) =>
                    updateTodo(todo.id, { isDone: !!checked })
                  }
                />
                <span className="flex-1 text-sm line-through text-muted-foreground">
                  {todo.title}
                </span>
                {linkedBadges}
                {getDueDateBadge(todo.dueDate)}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(todo.notes) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setExpandedId(isExpanded ? null : todo.id)}
                      title={isExpanded ? "Hide notes" : "Show notes"}
                    >
                      {isExpanded ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {isExpanded && todo.notes && (
                <div className="ml-12 text-sm text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
                  {todo.notes}
                </div>
              )}
            </div>
          );
        };

        return (
          <div className="space-y-2 mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Completed ({doneTodos.length})
            </p>
            {sortedYears.map(([yearKey, monthMap]) => {
              const yearCount = Array.from(monthMap.values()).reduce((s, arr) => s + arr.length, 0);
              const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
              return (
                <Collapsible key={yearKey} defaultOpen={yearKey === currentYear}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-left hover:bg-muted transition-colors group">
                    <span className="font-semibold text-sm">{yearKey}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {yearCount}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2 pl-2">
                    {sortedMonths.map(([monthKey, monthTodos]) => (
                      <Collapsible key={monthKey} defaultOpen={monthKey === currentMonth}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-1.5 text-left hover:bg-accent transition-colors group">
                          <span className="text-sm">{format(new Date(monthKey + "-01"), "MMMM")}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                              {monthTodos.length}
                            </span>
                            <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1 pt-1 pl-2">
                          {monthTodos.map((t, i) => renderTodo(t, i))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
