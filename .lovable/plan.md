

## Plan: Drag-and-Drop Parts Between Browser Windows + Export as File

### What this does
Makes parts in both Parts Libraries draggable so you can:
1. **Drag to another browser window/tab** of the same app — the part data gets imported into that library
2. **Drag to desktop/file explorer** — downloads a JSON file with the part data

### How it works

**HTML Drag API** — uses the browser's native `dragstart`/`drop` events with `dataTransfer`:
- On `dragstart`: serialize part data (name, part number, price, description) as JSON into `dataTransfer.setData('application/json', ...)` and also set `text/plain` with a human-readable summary. The `DownloadURL` type enables dragging to desktop as a `.json` file.
- On `drop`: the receiving library listens for drops, parses the JSON, and creates a new part via `addPart`.

### Files to change

1. **`src/pages/PartsLibrary.tsx`**
   - Add `draggable` attribute + `onDragStart` handler to each part row (lines view) and card (cards view)
   - Add `onDragOver`/`onDrop` handlers on the parts list container to accept incoming parts from other windows
   - On drop: parse JSON, call `addPart` to create the part, show a toast

2. **`src/pages/PartsLibrary2.tsx`**
   - Same changes as PartsLibrary.tsx for the second library

3. **No database changes needed** — uses existing `addPart` mutations

### Technical details

- `dataTransfer.setData('application/json', JSON.stringify(partData))` for cross-window transfer
- `dataTransfer.setData('DownloadURL', 'application/json:PartName.json:data:...')` for desktop file export
- Visual feedback: drop zone highlight when dragging over the library area
- Part images are NOT transferred (storage paths are user-specific); only metadata is copied
- Each library accepts drops from either library (cross-library transfer works too)

