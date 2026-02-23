

# DXF Three.js Viewer with Pan/Zoom

## Overview
Replace the current SVG-based DXF renderer with a Three.js canvas viewer using `dxf-parser` for parsing and `@react-three/fiber` + `@react-three/drei` for rendering with pan and zoom controls.

## Changes

### 1. Install dependencies
- `three` (>=0.133)
- `@react-three/fiber@^8.18` (React 18 compatible)
- `@react-three/drei@^9.122.0` (React 18 compatible)
- `dxf-parser` (parses DXF text into structured entity data)

### 2. Create `src/components/DxfThreeViewer.tsx`
A new component that:
- Accepts DXF text content as a prop
- Uses `dxf-parser` to parse into structured entities (lines, circles, arcs, polylines, lwpolylines, splines, ellipses)
- Renders each entity type as Three.js geometry (LineSegments, BufferGeometry, etc.)
- Uses an OrthographicCamera that auto-fits to the drawing bounds
- Uses `MapControls` from drei for 2D pan and zoom (mouse wheel zoom, click-drag pan)
- Responsive: fills container width, maintains a fixed aspect ratio height

### 3. Update `src/components/DxfFileCard.tsx`
- Replace the SVG `dangerouslySetInnerHTML` rendering with the new `DxfThreeViewer` component
- Keep the existing upload, delete, and signed URL fetching logic unchanged
- When no DXF is attached, show "No DXF available." text
- Pass the fetched DXF text to the Three.js viewer inside the dialog

### Entity rendering approach
Each DXF entity type will be converted to Three.js line geometry:
- **LINE**: Simple line between two points
- **CIRCLE**: Circle geometry using `BufferGeometry` with computed points
- **ARC**: Partial circle arc
- **POLYLINE / LWPOLYLINE**: Connected line segments (with optional bulge handling)
- **ELLIPSE**: Ellipse arc geometry
- All rendered as `Line2` or `LineSegments` with white/light color for contrast on dark background

### Controls
- `MapControls` from drei enables 2D pan (right-click or left-click drag) and scroll-to-zoom
- Camera auto-centers on the bounding box of all entities on load

## Technical Details

### Files modified
- `src/components/DxfFileCard.tsx` -- swap SVG viewer for Three.js viewer, add "No DXF available" state
- `src/components/DxfThreeViewer.tsx` -- new file with Three.js canvas and DXF entity rendering

### Files unchanged
- `src/hooks/useInventory.ts`
- `src/pages/ItemDetails.tsx`
- `src/types/inventory.ts`

