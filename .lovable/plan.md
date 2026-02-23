

# Custom Background Image

## Overview
Allow users to upload a custom photo/image and use it as their app background, in addition to the existing solid-color and designer theme options.

## How It Works

1. A new "Custom Image" option appears at the end of the background theme picker in Settings
2. Clicking it opens a file upload dialog where the user selects an image
3. The image is uploaded to cloud storage and stored in the user's profile
4. The image is applied as a full-screen background using CSS `background-image` on the root element
5. A subtle dark overlay ensures text remains readable on top of the image

## Changes Required

### 1. Storage bucket
- Create a new `backgrounds` storage bucket (private) with RLS policies so users can upload/view/delete their own background images

### 2. Database
- Add a `background_image_url` column to the `profiles` table to store the user's custom background image path

### 3. Update the color theme hook (`src/hooks/useColorTheme.ts`)
- Add `'custom'` to the `BackgroundTheme` type
- Load the `background_image_url` from the profile
- When `backgroundTheme === 'custom'`, apply the image as a CSS background on `document.documentElement` using inline styles
- When switching away from custom, remove the background image style

### 4. Update Settings page (`src/pages/Settings.tsx`)
- Add a "Custom Image" button at the end of the background options (with an upload icon instead of a color swatch)
- When clicked, open a file input to select an image
- Upload the image to the `backgrounds` bucket
- Save the signed URL to the profile and set the background theme to `'custom'`
- Show a small preview thumbnail when a custom background is active

### 5. CSS updates (`src/index.css`)
- Add a `.bg-custom` class that applies a dark-themed color scheme (similar to `bg-black`) so text is readable over any background image
- The actual image is applied via inline styles from JS

### 6. Update profile hook (`src/hooks/useProfile.ts`)
- Add `backgroundImageUrl` to the Profile interface and the fetch/update logic

## User Experience
- The custom image covers the full viewport, stays fixed while scrolling, and has a semi-transparent dark overlay for readability
- Cards and sidebars use their normal semi-transparent backgrounds on top
- Users can switch back to any preset theme at any time, which removes the custom image

