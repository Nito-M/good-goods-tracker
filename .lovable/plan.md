

## Fix: Focus Note Content Instead of Title on Edit

When clicking a note card, the edit dialog currently focuses the title input. The user wants focus to go to the content textarea instead.

### Changes

**File: `src/pages/Notes.tsx`**
- Add a `useRef` for the content textarea in the edit dialog
- Use a `useEffect` to focus the content textarea when `editingNote` is set
- Attach the ref to the edit dialog's `Textarea` component

### Technical Details

- Add `useRef<HTMLTextAreaElement>(null)` for the content textarea
- When `editingNote` changes to a non-null value, call `contentRef.current?.focus()` with a small timeout (to allow the dialog to render)
- Pass `autoFocus={false}` on the title input to prevent it from stealing focus
- The Dialog's `onOpenAutoFocus` can be used to prevent default focus behavior and instead focus the textarea

