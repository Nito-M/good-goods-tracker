
## Fix Recurring Events to Show 1 Year Ahead Continuously

### The Problem

In `src/pages/Calendar.tsx`, the `eventOccursOnDay` function caps recurring events at 1 year from their **creation date**:

```js
const oneYearLater = new Date(eventDate);
oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
if (day > oneYearLater) return false;
```

This means a biweekly event created 13 months ago simply stops showing up — even though it should still be recurring.

### The Fix

Change the upper bound to be 1 year from **today**, not from the event's start date. The event itself still starts from its original date and recurses correctly — we just extend the visibility window to always look 1 year ahead from now.

```js
// After fix — always shows up to 1 year ahead from today:
const oneYearFromToday = new Date();
oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1);
if (day > oneYearFromToday) return false;
```

### Result

- Biweekly (and all recurring) events will show indefinitely into the future
- The calendar will always display occurrences up to 1 year from the current date
- No event appears before its original start date (that lower bound guard stays)
- Only 1 line changes in `src/pages/Calendar.tsx` — no migrations or other files needed
