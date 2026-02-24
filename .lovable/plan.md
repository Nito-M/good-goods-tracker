

# Persist Background Image When Switching Themes

## Problem
Currently, when you switch from a custom background image to a color theme, the custom image button loses its preview thumbnail and clicking it triggers a new upload. The image is actually still saved, but there's no way to switch back to it without re-uploading.

## Solution
Make the custom image button always show the saved image thumbnail -- even when a different background theme is active. Clicking it will restore the custom background using the already-saved image (no re-upload needed). A separate small button will allow uploading a new image.

## Changes

### Settings Page (`src/pages/Settings.tsx`)
- **Always show the custom image thumbnail** on the custom button if a `backgroundImageUrl` exists, regardless of which theme is active
- **Clicking the custom button** when an image already exists will switch to `custom` theme using the saved image (no upload dialog)
- **Add a small "change image" icon** (or long-press / secondary action) to allow uploading a replacement image
- The upload-only behavior remains if no image has been saved yet

### No database or hook changes needed
The `backgroundImageUrl` is already preserved in the database and localStorage when switching themes. The image file remains in storage. This is purely a UI fix.
