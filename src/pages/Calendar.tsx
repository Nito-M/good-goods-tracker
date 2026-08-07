import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRequests } from "@/hooks/useRequests";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useJobs } from "@/hooks/useJobs";
import { useTripPlans } from "@/hooks/useTripPlans";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useTodos, Todo } from "@/hooks/useTodos";
import { EditRequestDialog } from "@/components/EditRequestDialog";
import { AddCalendarEventDialog } from "@/components/AddCalendarEventDialog";
import { EditCalendarEventDialog } from "@/components/EditCalendarEventDialog";
import { AddTripPlanDialog } from "@/components/AddTripPlanDialog";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { Request, RequestStatus } from "@/types/request";
import { CalendarEvent } from "@/types/calendarEvent";
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarPrintDialog } from "@/components/CalendarPrintDialog";
import { generateCalendarPdf, CalendarPdfSections, CalendarPdfDay } from "@/lib/calendarPdfGenerator";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  ShoppingCart,
  Package,
  XCircle,
  CalendarDays,
  Plus,
  Trash2,
  Repeat,
  Briefcase,
  MapPinned,
  ListChecks,
  Printer } from
"lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  differenceInDays,
  differenceInWeeks,
  getDate,
  getMonth } from
"date-fns";

const STATUS_CONFIG: Record<RequestStatus, {label: string;color: string;icon: React.ReactNode;}> = {
  pending: { label: "Pending", color: "bg-amber-500", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", color: "bg-blue-500", icon: <CheckCircle className="h-3 w-3" /> },
  ordered: { label: "Ordered", color: "bg-purple-500", icon: <ShoppingCart className="h-3 w-3" /> },
  received: { label: "Received", color: "bg-emerald-500", icon: <Package className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-500", icon: <XCircle className="h-3 w-3" /> }
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Check if an event occurs on a given day based on recurrence
function eventOccursOnDay(event: CalendarEvent, day: Date): boolean {
  const eventDate = new Date(event.eventDate + "T12:00:00");
  // Normalize day to noon to match eventDate and avoid off-by-one from differenceInDays
  const dayNoon = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0, 0);

  if (isSameDay(eventDate, dayNoon)) return true;
  if (dayNoon < eventDate) return false;

  // Show recurring events up to 1 year ahead from today (rolls forward continuously)
  const oneYearFromToday = new Date();
  oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1);
  if (dayNoon > oneYearFromToday) return false;

  switch (event.recurrence) {
    case "daily":
      return true;
    case "weekly":
      return eventDate.getDay() === dayNoon.getDay() && differenceInDays(dayNoon, eventDate) % 7 === 0;
    case "biweekly":
      return eventDate.getDay() === dayNoon.getDay() && differenceInDays(dayNoon, eventDate) % 14 === 0;
    case "yearly":
      return getMonth(eventDate) === getMonth(dayNoon) && getDate(eventDate) === getDate(dayNoon);
    default:
      return false;
  }
}

export function Calendar() {
  const navigate = useNavigate();
  const { requests, updateRequest, uploadImage, uploadPdf } = useRequests();
  const { events, createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { jobs } = useJobs();
  const { tripPlans, createTripPlan, deleteTripPlan } = useTripPlans();
  const { orders: purchaseOrders } = usePurchaseOrders();
  const { todos } = useTodos();
  const { allItems } = useInventory();
  const { profile } = useProfile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [addTripOpen, setAddTripOpen] = useState(false);

  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  }, [currentMonth]);

  const requestsByDate = useMemo(() => {
    const map = new Map<string, Request[]>();
    requests.forEach((request) => {
      if (request.needByDate) {
        const dateKey = format(parseLocalDate(request.needByDate), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, request]);
      }
    });
    return map;
  }, [requests]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    jobs.forEach((job) => {
      if (job.dueDate) {
        const dateKey = format(parseLocalDate(job.dueDate), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, job]);
      }
    });
    return map;
  }, [jobs]);

  const todosByDate = useMemo(() => {
    const map = new Map<string, Todo[]>();
    todos.forEach((todo) => {
      if (todo.dueDate) {
        const dateKey = format(parseLocalDate(todo.dueDate), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, todo]);
      }
    });
    return map;
  }, [todos]);

  // Get events for a specific day (including recurring)
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events.filter((e) => eventOccursOnDay(e, day));
  };

  const selectedDateRequests = useMemo(() => {
    if (!selectedDate) return [];
    return requestsByDate.get(format(selectedDate, "yyyy-MM-dd")) || [];
  }, [selectedDate, requestsByDate]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDay(selectedDate);
  }, [selectedDate, events]);

  const selectedDateJobs = useMemo(() => {
    if (!selectedDate) return [];
    return jobsByDate.get(format(selectedDate, "yyyy-MM-dd")) || [];
  }, [selectedDate, jobsByDate]);

  const selectedDateTrips = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return tripPlans.filter((tp) => {
      if (tp.endDate) {
        return dateKey >= tp.startDate && dateKey <= tp.endDate;
      }
      return tp.startDate === dateKey;
    });
  }, [selectedDate, tripPlans]);

  const selectedDateTodos = useMemo(() => {
    if (!selectedDate) return [];
    return todosByDate.get(format(selectedDate, "yyyy-MM-dd")) || [];
  }, [selectedDate, todosByDate]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const RECURRENCE_LABELS: Record<string, string> = {
    none: "",
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Biweekly",
    yearly: "Yearly"
  };

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Calendar
          </h1>
          <p className="text-muted-foreground"> View requests and events by date</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[160px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((day) =>
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayRequests = requestsByDate.get(dateKey) || [];
                const dayEvents = getEventsForDay(day);
                const dayJobs = jobsByDate.get(dateKey) || [];
                const dayTrips = tripPlans.filter((tp) => tp.endDate ? dateKey >= tp.startDate && dateKey <= tp.endDate : tp.startDate === dateKey);
                const dayTodos = todosByDate.get(dateKey) || [];
                const totalItems = dayRequests.length + dayEvents.length + dayJobs.length + dayTrips.length + dayTodos.length;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isDayToday = isToday(day);

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[80px] md:min-h-[100px] p-1 border rounded-lg text-left transition-colors",
                      "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary",
                      !isCurrentMonth && "opacity-40",
                      isSelected && "ring-2 ring-primary bg-accent",
                      isDayToday && !isSelected && "bg-primary/10"
                    )}>

                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                          isDayToday && "bg-primary text-primary-foreground"
                        )}>

                        {format(day, "d")}
                      </span>
                      {totalItems > 0 &&
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                          {totalItems}
                        </Badge>
                      }
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((event, idx) =>
                      <div
                        key={`evt-${event.id}-${idx}`}
                        className={cn("text-xs px-1.5 py-0.5 rounded truncate text-white", event.color)}
                        title={event.title}>

                          {event.recurrence !== "none" && "↻ "}
                          {event.title}
                        </div>
                      )}
                      {dayJobs.slice(0, Math.max(0, 3 - dayEvents.length)).map((job) =>
                      <div
                        key={`job-${job.id}`}
                        className="text-xs px-1.5 py-0.5 rounded truncate text-white bg-orange-500"
                        title={`${job.jobNumber || "JOB"}: ${job.title}`}>
                          📋 {job.title}
                        </div>
                      )}
                      {dayRequests.slice(0, Math.max(0, 3 - dayEvents.length - dayJobs.length)).map((request) =>
                      <div
                        key={request.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded truncate text-white",
                          STATUS_CONFIG[request.status].color
                        )}
                        title={request.itemName}>

                          {request.itemName}
                        </div>
                      )}
                      {dayTrips.slice(0, Math.max(0, 3 - dayEvents.length - dayJobs.length - dayRequests.length)).map((trip) =>
                      <div
                        key={`trip-${trip.id}`}
                        className={cn("text-xs px-1.5 py-0.5 rounded truncate text-white", trip.color)}
                        title={trip.title}>
                          📍 {trip.title}
                        </div>
                      )}
                      {dayTodos.slice(0, Math.max(0, 3 - dayEvents.length - dayJobs.length - dayRequests.length - dayTrips.length)).map((todo) =>
                      <div
                        key={`todo-${todo.id}`}
                        className={cn("text-xs px-1.5 py-0.5 rounded truncate text-white", todo.isDone ? "bg-emerald-500" : "bg-rose-500")}
                        title={todo.title}>
                          ✓ {todo.title}
                        </div>
                      )}
                      {totalItems > 3 &&
                      <div className="text-xs text-muted-foreground pl-1">
                          +{totalItems - 3} more
                        </div>
                      }
                    </div>
                  </button>);

              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a date"}
              </CardTitle>
              {selectedDate &&
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setAddEventOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Event
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAddTripOpen(true)}>
                  <MapPinned className="h-4 w-4 mr-1" /> Plan
                </Button>
              </div>
              }
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDate ?
            <p className="text-sm text-muted-foreground">Click on a date to view details</p> :

            <>
                {/* Events */}
                {selectedDateEvents.length > 0 &&
              <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Events</p>
                    {selectedDateEvents.map((event) =>
                <div
                  key={event.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setEditingEvent(event)}>

                        <div className="flex items-start gap-2">
                          <div className={cn("w-3 h-3 rounded-full mt-1 shrink-0", event.color)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{event.title}</p>
                            {event.description &&
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                      }
                            {event.recurrence !== "none" &&
                      <div className="flex items-center gap-1 mt-1">
                                <Repeat className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {RECURRENCE_LABELS[event.recurrence]}
                                </span>
                              </div>
                      }
                          </div>
                          <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {e.stopPropagation();deleteEvent(event.id);}}>

                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                )}
                  </div>
              }

                {/* Requests */}
                {selectedDateRequests.length > 0 &&
              <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requests</p>
                {selectedDateRequests.map((request) =>
                <button
                  key={request.id}
                  onClick={() => request.requestNumber ? navigate(`/requests/view/${request.requestNumber}`) : setEditingRequest(request)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">

                        <div className="flex items-start gap-2">
                          <div
                      className={cn("p-1 rounded text-white mt-0.5", STATUS_CONFIG[request.status].color)}>

                            {STATUS_CONFIG[request.status].icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{request.itemName}</p>
                            {request.requestNumber &&
                      <p className="text-xs text-muted-foreground">{request.requestNumber}</p>
                      }
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {request.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Qty: {request.quantity}</span>
                            </div>
                            {request.requesterName &&
                      <p className="text-xs text-muted-foreground mt-1">By: {request.requesterName}</p>
                      }
                          </div>
                        </div>
                      </button>
                )}
                  </div>
              }

                {/* Job Deadlines */}
                {selectedDateJobs.length > 0 &&
              <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job Deadlines</p>
                    {selectedDateJobs.map((job) =>
                <a
                  key={job.id}
                  href={`/jobs/${job.id}/description`}
                  className="block w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="p-1 rounded bg-orange-500 text-white mt-0.5">
                            <Briefcase className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{job.title}</p>
                            {job.jobNumber &&
                      <p className="text-xs text-muted-foreground">{job.jobNumber}</p>
                      }
                            <Badge variant="outline" className="text-xs capitalize mt-1">
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      </a>
                )}
                  </div>
              }

                {/* Trip Plans */}
                {selectedDateTrips.length > 0 &&
              <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trip Plans</p>
                    {selectedDateTrips.map((trip) =>
                <div
                  key={trip.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigate(`/calendar/trip/${trip.id}`)}>
                        <div className="flex items-start gap-2">
                          <div className={cn("w-3 h-3 rounded-full mt-1 shrink-0", trip.color)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{trip.title}</p>
                            {trip.endDate && (
                              <p className="text-xs text-muted-foreground">
                                {trip.startDate} → {trip.endDate}
                              </p>
                            )}
                            {trip.notes && <p className="text-xs text-muted-foreground mt-0.5">{trip.notes}</p>}
                            {trip.locations.length > 0 && (
                              <div className="mt-1.5 space-y-0.5">
                                {trip.locations.map((loc, idx) => (
                                  <div key={loc.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPinned className="h-3 w-3 shrink-0" />
                                    <span>{idx + 1}. {loc.name}</span>
                                    {loc.address && <span className="truncate">— {loc.address}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {trip.pos.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {trip.pos.map((po) => (
                                  <Badge key={po.id} variant="outline" className="text-xs">
                                    {po.poNumber || "PO"}{po.vendorName ? ` — ${po.vendorName}` : ""}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => deleteTripPlan(trip.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                )}
                  </div>
              }

                {/* To-Dos */}
                {selectedDateTodos.length > 0 &&
              <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To-Dos</p>
                    {selectedDateTodos.map((todo) =>
                <div
                  key={todo.id}
                  className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate("/notes")}>
                        <div className="flex items-start gap-2">
                          <div className={cn("p-1 rounded text-white mt-0.5", todo.isDone ? "bg-emerald-500" : "bg-rose-500")}>
                            <ListChecks className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium text-sm truncate", todo.isDone && "line-through text-muted-foreground")}>{todo.title}</p>
                            {todo.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{todo.notes}</p>}
                            <Badge variant="outline" className="text-xs capitalize mt-1">
                              {todo.isDone ? "Done" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                )}
                  </div>
              }

                {selectedDateEvents.length === 0 && selectedDateRequests.length === 0 && selectedDateJobs.length === 0 && selectedDateTrips.length === 0 && selectedDateTodos.length === 0 &&
              <p className="text-sm text-muted-foreground">Nothing on this date</p>
              }
              </>
            }
          </CardContent>
        </Card>
      </div>

      {/* Status Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">Status:</span>
            {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((status) =>
            <div key={status} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded", STATUS_CONFIG[status].color)} />
                <span className="text-sm text-muted-foreground">{STATUS_CONFIG[status].label}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-sm text-muted-foreground">Job Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-teal-500" />
              <span className="text-sm text-muted-foreground">Trip Plan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-sm text-muted-foreground">To-Do</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditRequestDialog
        request={editingRequest}
        items={allItems}
        requesterNames={profile?.requesterNames || []}
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        onSave={updateRequest}
        onUploadImage={uploadImage}
        onUploadPdf={uploadPdf} />

      <AddCalendarEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        selectedDate={selectedDate}
        onSave={createEvent} />

      <EditCalendarEventDialog
        event={editingEvent}
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
        onSave={updateEvent} />

      <AddTripPlanDialog
        open={addTripOpen}
        onOpenChange={setAddTripOpen}
        onSave={createTripPlan}
        purchaseOrders={purchaseOrders}
        selectedDate={selectedDate} />

    </div>);

}