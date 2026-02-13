
## Make Job Items Section Wider

### Problem
The Job Items table in the Job Detail view currently occupies 2 out of 3 columns (`lg:col-span-2` in a `lg:grid-cols-3` grid), which constrains the table width and makes thumbnails hard to see clearly.

### Solution
Widen the Job Items section by adjusting the grid layout and increasing the thumbnail size.

### Changes

**`src/pages/Jobs.tsx`**

1. Change the thumbnail size from `w-12 h-12` (48px) to `w-16 h-16` (64px) for both the image and the placeholder, and update the column header width accordingly (`w-14` to `w-18`).

2. Change the grid layout from `lg:grid-cols-3` with `lg:col-span-2` to `xl:grid-cols-[1fr_320px]` -- this gives the items table all remaining space while the sidebar stays a fixed 320px width. On smaller screens it stacks vertically.

This keeps the sidebar at a reasonable fixed width while letting the items table stretch to use all available space.
