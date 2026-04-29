## Goal

Make the formatting buttons in the Notes editor (Bold, Italic, H1, H2, lists, quote, code, etc.) act as **toggleable modes**: press once to turn ON (button highlights), and any text you type from then on is wrapped in that formatting. Press again to turn OFF.

## Current Behavior

The editor in `src/pages/Notes.tsx` is a plain `<Textarea>`. The toolbar buttons just append placeholder snippets like `**bold text**` to the end of the content. There's no caret tracking and no "active mode" state, so formatting can't persist across keystrokes.

## Proposed Behavior

Two parts to "stays bold until I press the button again":

1. **Visual toggle state** — clicking Bold highlights the button (active style) and clicking again deselects it. Multiple inline modes (bold + italic) can be active at the same time. Block modes (H1, H2, quote, code block, list, checklist) are mutually exclusive — picking one replaces any other active block mode.

2. **Typing behavior** — while a mode is active:
   - **Inline modes (Bold, Italic)**: as you type, characters are wrapped live. E.g. with Bold on, typing `hello` produces `**hello**` and the caret stays inside the `**…**`. Toggling Bold off closes the wrapper and the caret moves outside it. Toggling on with text already selected wraps the selection immediately.
   - **Block modes (H1, H2, Quote, Code, Bullet list, Numbered list, Checklist)**: pressing the button inserts the prefix on the current line (`# `, `## `, `> `, `- `, `1. `, `- [ ] `) and applies the same prefix to each new line you create with Enter. Toggling off stops adding the prefix on subsequent lines.
   - **Divider (`---`)**: stays as a one-shot insert (no toggle state); pressing it just drops a divider where the caret is.

## Technical Plan

All changes contained in `src/pages/Notes.tsx`. No new dependencies, no DB changes.

### 1. Refactor `FormatToolbar` and the editors into a controlled component

Replace the current `FormatToolbar` + raw `<Textarea>` pairs (used in the Create dialog and the `EditNoteBody` component) with a single new component `MarkdownEditor` that owns:

- A `ref` to the textarea (for caret/selection access).
- `activeInline: Set<'bold' | 'italic'>` state.
- `activeBlock: 'h1' | 'h2' | 'quote' | 'code' | 'ul' | 'ol' | 'checklist' | null` state.
- The textarea `value` / `onChange` passed in from the parent (so existing save logic is untouched).

### 2. Toolbar button styling

Each button receives an `active` boolean. When active, render with the `secondary` variant (or `bg-accent text-accent-foreground`) so it visibly looks "pressed". Use the existing `Toggle` component from `src/components/ui/toggle.tsx` if it fits — it already provides pressed/unpressed visuals via `data-state=on`.

### 3. Inline toggle logic (Bold / Italic)

On click:
- If text is selected: wrap/unwrap the selection with `**…**` (bold) or `*…*` (italic) immediately, no mode change.
- If no selection: flip the mode in `activeInline`. Insert the opening marker at the caret if turning on, or move the caret past the closing marker if turning off.

While a mode is on, intercept `onChange`:
- Detect the diff (single char inserted at caret). Re-insert the char inside the wrapper so the closing `**` stays to the right of the caret. Implementation: maintain "open wrapper position" while mode is on; on every keystroke ensure the closing marker sits exactly `caret` characters after the opening marker.

### 4. Block toggle logic (H1, H2, Quote, Code, lists, checklist)

On click:
- Apply the prefix to the current line (replace any existing block prefix on that line first, since block modes are mutually exclusive).
- Set `activeBlock` to the chosen mode (or `null` if clicking the same active one again).

While `activeBlock` is set, intercept `onKeyDown` for `Enter`:
- Insert `\n` followed by the active prefix (`# `, `- `, `- [ ] `, `1. ` with auto-incrementing number for `ol`).
- For `ol`, track the next number per editor instance.
- Pressing Enter on an empty prefixed line clears the prefix and turns the block mode off (standard markdown editor behavior).

Code block (` ``` `) is handled as a one-shot insert of the fenced block, since multi-line code mode would require closing-fence tracking; toggling it just inserts the fenced template at the caret.

### 5. Divider

Keep current behavior: insert `\n---\n` at caret, no toggle state.

### 6. Usage sites

Replace the two existing `<FormatToolbar … /> <Textarea …/>` blocks (one in the create dialog around line 443+, one in `EditNoteBody` around line 614+) with `<MarkdownEditor value={…} onChange={…} placeholder="…" />`. The save flow, autosave, download, and print logic all keep working unchanged because they still read the same string.

### 7. Edge cases handled

- Switching focus away from the textarea clears `activeInline` / `activeBlock` (so the modes don't silently apply when you come back).
- Clicking inside the textarea at a new position also clears modes (mode is tied to the current typing run, like Word's "B" button).
- Selecting text while a mode is active and clicking the button wraps the selection and exits mode.

## Out of Scope

- Switching to a true rich-text editor (TipTap, Lexical, etc.). The notes are stored as markdown strings and rendered as markdown elsewhere; keeping that pipeline intact.
- Changing how notes are rendered/previewed.
- Toolbar behavior in any other page (this is Notes-only).