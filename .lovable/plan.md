
## Guarantee at Least One Item Renders on Page 1

### The Root Cause

After rendering the logo, business info, title, quote details, and bill-to block, `flowY` can be large enough that by the time the items table header is drawn, `y` is near `safeBottom`. The current page-break check (line 201) then fires immediately for the **first item**, sending it to page 2 and leaving page 1 with nothing but the header block.

```
Page 1 height = 297mm
safeBottom    = 277mm  (297 - 20)

Example flowY after header sections = ~170mm
Table header adds ~10mm → y = 180mm
First item (2 lines + note) = ~20mm → 180 + 20 = 200mm  ✓ fits
```

But with a large logo + long business address + bill-to address, flowY can reach 220mm+, so `y = 230` and the very first item check `230 + 20 > 277` triggers a page break.

### The Fix — Two-Part Change in `src/lib/quoteGenerator.ts`

**Part 1: Track whether this is the first item**

Introduce a `isFirstItem` flag. When it's `true`, skip the page-break check regardless of `y`. This guarantees the first item always renders on page 1.

```typescript
let isFirstItem = true;

quote.items.forEach((item) => {
  // ... calculate nameLines, rowHeight, noteLines, itemTotalHeight ...

  // Only check page break after the first item has been placed
  if (!isFirstItem && y + itemTotalHeight > safeBottom) {
    y = addPageWithHeader(true, tableX);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
  }

  isFirstItem = false;

  // ... render the item ...
});
```

**Part 2: After the first item, enforce the overflow safety for the rest**

After the first item is rendered, the normal overflow logic continues to work for items 2, 3, etc. — so subsequent items still get proper page breaks.

### What This Does NOT Change

- All other pagination logic (separator line, totals, notes, footer on every page) stays exactly the same.
- The table header on page 1 and repeated headers on overflow pages are unchanged.
- Multi-line item name wrapping and note rendering are unchanged.

### File to Modify

- `src/lib/quoteGenerator.ts` — one small change inside the `quote.items.forEach` loop (lines 188–224).

### Edge Case Considered

If the first item itself is extremely tall (e.g. 100 lines of notes), it will overflow the bottom of page 1. This is unavoidable without splitting a single item across pages, which is a separate concern. The guarantee is "the first item starts on page 1", not "the first item fully fits on page 1" — which matches user expectation.
