

## Solid Table Backgrounds on Picture Backgrounds

### Problem
When using a custom picture background with reduced card opacity, tables become see-through because their container (`bg-card`) respects `--card-opacity` but the `--muted` color used for table headers and hover states does not. This creates an inconsistent, hard-to-read appearance.

### Solution
Update the `--muted` CSS variable in both custom background theme variants (dark and light) to include `var(--card-opacity, 1)`, matching how `--card`, `--accent`, `--secondary`, and other surface colors already work.

### Changes

**File: `src/index.css`**

1. In `.bg-custom` (dark custom background, line 571):
   - Change `--muted: 0 0% 25%;` to `--muted: 0 0% 25% / var(--card-opacity, 1);`

2. In `.bg-custom-light` (light custom background, line 596):
   - Change `--muted: 215 20% 65%;` to `--muted: 215 20% 65% / var(--card-opacity, 1);`

This ensures that when card opacity is set to 100% (the default), tables look completely solid. When opacity is reduced, table backgrounds will match the rest of the UI's transparency level consistently.

### Files to modify
- `src/index.css` (2 lines)

