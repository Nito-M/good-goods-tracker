import { useState, useMemo } from "react";
import { useRequests } from "@/hooks/useRequests";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { EditRequestDialog } from "@/components/EditRequestDialog";
import { AddCalendarEventDialog } from "@/components/AddCalendarEventDialog";
import { EditCalendarEventDialog } from "@/components/EditCalendarEventDialog";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { Request, RequestStatus } from "@/types/request";
import { CalendarEvent } from "@/types/calendarEvent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Repeat } from
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

  if (isSameDay(eventDate, day)) return true;
  if (day < eventDate) return false;

  // Show recurring events up to 1 year ahead from today (rolls forward continuously)
  const oneYearFromToday = new Date();
  oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1);
  if (day > oneYearFromToday) return false;

  switch (event.recurrence) {
    case "daily":
      return true;
    case "weekly":
      return eventDate.getDay() === day.getDay() && differenceInDays(day, eventDate) % 7 === 0;
    case "biweekly":
      return eventDate.getDay() === day.getDay() && differenceInDays(day, eventDate) % 14 === 0;
    case "yearly":
      return getMonth(eventDate) === getMonth(day) && getDate(eventDate) === getDate(day);
    default:
      return false;
  }
}

export function Calendar() {
  const { requests, updateRequest, uploadImage, uploadPdf } = useRequests();
  const { events, createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { allItems } = useInventory();
  const { profile } = useProfile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);

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
                const totalItems = dayRequests.length + dayEvents.length;
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
                      {dayRequests.slice(0, Math.max(0, 3 - dayEvents.length)).map((request) =>
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
              <Button size="sm" variant="outline" onClick={() => setAddEventOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Event
                </Button>
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
                  onClick={() => setEditingRequest(request)}
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

                {selectedDateEvents.length === 0 && selectedDateRequests.length === 0 &&
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

    </div>);

}