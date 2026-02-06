import { useState, useMemo } from "react";
import { useRequests } from "@/hooks/useRequests";
import { EditRequestDialog } from "@/components/EditRequestDialog";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { Request, RequestStatus } from "@/types/request";
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
} from "lucide-react";
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
  parseISO,
} from "date-fns";

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-amber-500", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", color: "bg-blue-500", icon: <CheckCircle className="h-3 w-3" /> },
  ordered: { label: "Ordered", color: "bg-purple-500", icon: <ShoppingCart className="h-3 w-3" /> },
  received: { label: "Received", color: "bg-emerald-500", icon: <Package className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-500", icon: <XCircle className="h-3 w-3" /> },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar() {
  const { requests, updateRequest, uploadImage } = useRequests();
  const { allItems } = useInventory();
  const { profile } = useProfile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);

  // Parse need_by_date safely using local timezone
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // Get calendar days including padding days from prev/next months
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Map requests to dates based on needByDate
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

  // Get requests for selected date
  const selectedDateRequests = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return requestsByDate.get(dateKey) || [];
  }, [selectedDate, requestsByDate]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleEdit = (request: Request) => {
    setEditingRequest(request);
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
          <p className="text-muted-foreground">
            View requests by their need-by date
          </p>
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
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayRequests = requestsByDate.get(dateKey) || [];
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
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                          isDayToday && "bg-primary text-primary-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayRequests.length > 0 && (
                        <Badge variant="secondary" className="text-xs h-5 px-1.5">
                          {dayRequests.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayRequests.slice(0, 3).map((request) => (
                        <div
                          key={request.id}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate text-white",
                            STATUS_CONFIG[request.status].color
                          )}
                          title={request.itemName}
                        >
                          {request.itemName}
                        </div>
                      ))}
                      {dayRequests.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-1">
                          +{dayRequests.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Click on a date to view its requests
              </p>
            ) : selectedDateRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No requests due on this date
              </p>
            ) : (
              selectedDateRequests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => handleEdit(request)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "p-1 rounded text-white mt-0.5",
                        STATUS_CONFIG[request.status].color
                      )}
                    >
                      {STATUS_CONFIG[request.status].icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {request.itemName}
                      </p>
                      {request.requestNumber && (
                        <p className="text-xs text-muted-foreground">
                          {request.requestNumber}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {request.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Qty: {request.quantity}
                        </span>
                      </div>
                      {request.requesterName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {request.requesterName}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">Status:</span>
            {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-3 h-3 rounded",
                    STATUS_CONFIG[status].color
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {STATUS_CONFIG[status].label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditRequestDialog
        request={editingRequest}
        items={allItems}
        requesterNames={profile?.requesterNames || []}
        open={!!editingRequest}
        onOpenChange={(open) => !open && setEditingRequest(null)}
        onSave={updateRequest}
        onUploadImage={uploadImage}
      />
    </div>
  );
}
