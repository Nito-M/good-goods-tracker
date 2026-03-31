

## Plan: Update How To Do Details Page

### Changes (single file: `src/components/HowToDoPage.tsx`)

1. **Rename "Add Card" to "Add Instruction"** — Change the button label on line 661 from `Add Card` to `Add Instruction`.

2. **Remove the file upload area and files grid from the instruction details page** — Remove lines 550-648 (the "Files & Images" upload zone and the files grid). This only affects the instruction-level detail view; card-level file uploads remain untouched.

### Technical Details
- File: `src/components/HowToDoPage.tsx`
- Lines 550-648: Remove the entire file upload drop zone (`{/* File Upload Area */}`) and the files grid (`{/* Files Grid */}`) sections
- Line 661: Change `Add Card` → `Add Instruction`
- The `uploadFile`, `deleteFile`, drag/drop handlers at the instruction level can remain in code (dead code) or be cleaned up — no functional impact either way

