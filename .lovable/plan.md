

## Auto-Expanding Description Textarea

### Problem
The description textarea has a fixed height (`rows={6}`), so longer text requires scrolling inside the box.

### Fix
Update the `<Textarea>` for the description field in `src/pages/EditJob.tsx` to auto-resize based on content. This can be done by:

1. Adding a `className="resize-none overflow-hidden"` to prevent manual resize and hide the scrollbar
2. Using a small `useEffect` (or an `onInput` handler) that sets `textarea.style.height = textarea.scrollHeight + "px"` whenever the content changes

### Technical Details

**File: `src/pages/EditJob.tsx`**

- Add a `ref` to the description `Textarea`
- Add a small effect that auto-sizes the textarea whenever `formDescription` changes:
  ```typescript
  const descRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = descRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [formDescription]);
  ```
- Update the Textarea to use `ref={descRef}` and add `className="resize-none overflow-hidden"` plus `rows={3}` as a minimum starting height

This is a small, self-contained change to one file. The textarea will grow to fit all content so nothing is hidden.

