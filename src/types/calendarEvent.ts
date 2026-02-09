export type RecurrenceType = "none" | "daily" | "weekly" | "biweekly" | "yearly";

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  eventDate: string; // YYYY-MM-DD
  recurrence: RecurrenceType;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  eventDate: string;
  recurrence: RecurrenceType;
  color: string;
}
