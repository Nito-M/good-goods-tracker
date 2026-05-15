## Goal

Give super admins full control over the Welcome screen's timing and the greeting's appearance/placement, all from Settings → General → Welcome Screen.

## New super-admin controls (in `WelcomeScreenSettings.tsx`)

1. **Greeting start delay** (slider, 0–10s, step 0.5s) — how long after the page loads before the letters begin to animate in.
2. **Letter stagger speed** (slider, 20–200ms, step 10ms) — delay between each letter.
3. **Background behavior** — toggle "Keep background still until greeting starts". When on, the slow-zoom animation only kicks in once the greeting begins.
4. **Greeting size** (slider, 2–12rem, step 0.25) — applied to the H1 font size. Mobile auto-scales proportionally.
5. **Greeting position** — two sliders for horizontal (0–100%) and vertical (0–100%) placement, plus a 9-cell quick-pick grid (top-left, top-center, …, bottom-right) that sets both sliders at once.
6. **Text alignment** (left / center / right) — controls how the greeting text aligns within its container.

A live preview tile at the top of the card renders a miniature Welcome screen with the current settings so changes are visible without leaving Settings.

## Database

Extend `app_welcome_settings` (singleton row, id=1) with new columns — all nullable with sensible defaults so existing rows keep working:

- `start_delay_ms` int, default 500
- `letter_stagger_ms` int, default 50
- `bg_animate_with_greeting` bool, default false
- `font_size_rem` numeric, default 8
- `position_x_pct` int, default 50
- `position_y_pct` int, default 50
- `text_align` text, default 'center' (check: left/center/right)

RLS unchanged (all signed-in users read; super admin writes).

## Welcome page (`src/pages/Welcome.tsx`)

- Load the new fields together with the existing ones.
- Use `start_delay_ms` for the initial mask-reveal delay (replaces the hard-coded 500ms).
- Use `letter_stagger_ms` for per-letter offsets (replaces the hard-coded 50ms).
- Apply `font_size_rem` inline on the H1; keep responsive scaling via a `clamp()` so it doesn't overflow on small screens.
- Replace the centered flex layout with absolute positioning driven by `position_x_pct` / `position_y_pct` (using `left/top` + `translate(-50%,-50%)` so the percentage refers to the greeting's center).
- Apply `text_align` to the H1.
- If `bg_animate_with_greeting` is true, add the `welcome-bg-zoom` class only after the start delay (via a `setTimeout` + state). Otherwise behave as today.

## Out of scope

- No changes to the navigation, route, or who can view the page.
- No changes to greeting text content rules (still "{greeting} {displayName}").
- No changes to the upload flow or storage bucket.

## Files touched

- `supabase/migrations/<new>.sql` — add columns + check constraint.
- `src/components/WelcomeScreenSettings.tsx` — new controls + live preview.
- `src/pages/Welcome.tsx` — consume the new fields.
- `src/integrations/supabase/types.ts` — auto-regenerated.
