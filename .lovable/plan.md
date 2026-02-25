

## Make All Inputs, Search Bars, and Dialogs Solid on Picture Backgrounds

### Problem
When a custom picture background is set, several UI elements appear transparent because they use `bg-background`, which is intentionally fully transparent in custom background mode (to let the picture show through). This affects:
- Search bars (Jobs, Requests)
- Manage Requesters section inputs
- Create New Request dialog and all its form fields
- All outline buttons (combobox triggers, date pickers, etc.)

### Root Cause
In the custom background CSS classes, `--background` is set to fully transparent (`opacity: 0`) so the picture shows through. But form elements like inputs, textareas, select triggers, dialogs, and outline buttons all use `bg-background`, making them see-through too.

Additionally, `--input` (used for borders on form controls) uses a fixed low opacity (0.6 / 0.7) instead of respecting the card opacity setting.

### Solution
Switch all form-level components from `bg-background` to `bg-card`, which correctly respects `--card-opacity` in custom background modes. Also update `--input` border color to use `var(--card-opacity, 1)`.

### Changes

**1. `src/components/ui/input.tsx`**
- Change `bg-background` to `bg-card` so all search bars and text inputs are solid

**2. `src/components/ui/textarea.tsx`**
- Change `bg-background` to `bg-card`

**3. `src/components/ui/select.tsx` (SelectTrigger)**
- Change `bg-background` to `bg-card` so dropdown triggers are solid

**4. `src/components/ui/dialog.tsx` (DialogContent)**
- Change `bg-background` to `bg-card` so the Create New Request dialog is solid

**5. `src/components/ui/button.tsx` (outline variant)**
- Change `bg-background` to `bg-card` so outline buttons (combobox triggers, etc.) are solid

**6. `src/index.css`**
- In `.bg-custom`: change `--input: 0 0% 25% / 0.6` to `--input: 0 0% 25% / var(--card-opacity, 1)`
- In `.bg-custom-light`: change `--input: 212 26% 83% / 0.7` to `--input: 212 26% 83% / var(--card-opacity, 1)`

### Files to modify
- `src/components/ui/input.tsx` (1 line)
- `src/components/ui/textarea.tsx` (1 line)
- `src/components/ui/select.tsx` (1 line)
- `src/components/ui/dialog.tsx` (1 line)
- `src/components/ui/button.tsx` (1 line)
- `src/index.css` (2 lines)

