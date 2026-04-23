
# Plan: Copy/Paste board between orgs via clipboard

## Goal
Instead of picking a target company in a dialog, let you **Copy** a board from one place and **Paste** it into another org/board list — like a real clipboard.

## How it works for the user

1. **Copy a board**
   - On `/boards` (each board card): a **Copy** icon → puts the board on the clipboard.
   - On `/boards/:id` (header): a **Copy board** button → same thing.
   - Toast: *"Board copied. Open another org and paste."*

2. **Switch org** using the existing org switcher (top nav / sidebar). The clipboard persists across navigation and reloads.

3. **Paste**
   - A **Paste board** button appears at the top of `/boards` whenever the clipboard has a board (and only then).
   - Clicking it opens a small dialog: pick a **target company** in the current org + confirm/edit the new name (defaults to `"<Original> (Copy)"`).
   - Confirm → board is duplicated into that company, you're navigated to the new board, clipboard is cleared.
   - A small **×** on the Paste button discards the clipboard without pasting.

## Clipboard storage

Stored in `localStorage` under `boardClipboard`:
```ts
{ sourceBoardId: string, sourceBoardName: string, sourceCompanyId: string | null, copiedAt: string }
```
- Survives reloads and org switches (same browser).
- One slot — copying a new board overwrites it.
- Cleared after a successful paste or via the × button.

On paste, we re-fetch the source board fresh from the DB (so any edits made between copy & paste are included). If the source board no longer exists or you've lost access, the paste fails with a clear toast and the clipboard is cleared.

## Reusing existing work

The deep-copy engine (`src/lib/copyBoard.ts`) and the `copyBoard` mutation in `useBoards` already do exactly the right thing — column/row/cell/merge/note remapping, org resolution, access grant. No changes there.

What changes:
- **Replace** the current "open dialog immediately" flow on the Copy button with "put on clipboard" behavior.
- **Add** a Paste flow on `/boards`.

## Technical changes

- **New `src/hooks/useBoardClipboard.ts`** — small hook around `localStorage` with a storage-event listener so multiple tabs stay in sync. Exposes `{ clipboard, copyToClipboard(board), clear() }`.
- **New `src/components/board/PasteBoardDialog.tsx`** — target company picker (scoped to current org's companies) + name input. Calls existing `copyBoard(...)` from `useBoards`. On success: clears clipboard, navigates to the new board.
- **`src/pages/Boards.tsx`** — 
  - Copy icon on each card now calls `copyToClipboard(board)` (no dialog).
  - Renders a **Paste board** pill near the page header when `clipboard` is set, with × to discard.
- **`src/pages/BoardDetail.tsx`** — header **Copy board** button now calls `copyToClipboard(board)` instead of opening the dialog.
- **Delete** `src/components/board/CopyBoardDialog.tsx` (replaced by `PasteBoardDialog`).

## Edge cases handled
- Paste button only shows when clipboard is non-empty.
- If the source board was deleted or access revoked: toast error, clear clipboard.
- Pasting into the same org/company is allowed (just creates a duplicate there).
- Clipboard is per-browser; doesn't sync across devices (out of scope).
