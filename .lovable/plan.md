

# Fix DXF Preview Rendering

## Problem
The DXF drawing renders incorrectly due to three bugs in the polyline/bulge arc handling in `DxfThreeViewer.tsx`:

1. **Closed polylines not closing with arcs**: When a polyline is marked as closed (`shape = true`), the code draws a straight line from the last vertex to the first. If the last vertex has a bulge value, it should draw an arc instead.

2. **Negative bulge arcs go the wrong way**: The `addCirclePoints` helper always sweeps counter-clockwise. For negative bulge values (clockwise arcs), this draws the major arc instead of the minor arc, producing visually incorrect results.

3. **Arc sweep calculation**: The arc sweep angle should be computed directly from the bulge value using the formula `theta = 4 * atan(|bulge|)` rather than relying on atan2-based start/end angles which are ambiguous about direction.

## Solution

Rewrite the bulge-to-arc conversion in `src/components/DxfThreeViewer.tsx` with a dedicated `addBulgeArc` function that:

- Computes the included angle: `theta = 4 * atan(|bulge|)`
- Computes the radius: `r = dist / (2 * sin(theta/2))`
- Finds the arc center using the perpendicular offset from the chord midpoint
- Sweeps in the correct direction based on the sign of the bulge
- Generates arc segments from the computed startAngle, sweeping by exactly `theta` in the right direction

Also fix the closing segment logic:
- When `e.shape` is true, process the last-to-first vertex pair through the same bulge-aware logic (not just a straight line)

## File Changed
- `src/components/DxfThreeViewer.tsx` -- rewrite the POLYLINE/LWPOLYLINE case (lines 63-101) with corrected bulge arc math and proper closing-segment handling.

## Technical Details

The corrected bulge arc function:

```text
addBulgeArc(v1, v2, bulge):
  theta = 4 * atan(|bulge|)
  d = distance(v1, v2)
  r = d / (2 * sin(theta / 2))
  
  // Midpoint and perpendicular
  mid = (v1 + v2) / 2
  perp = normalize(rotate90(v2 - v1))
  
  // Offset from midpoint to center
  offset = r * cos(theta / 2)
  sign = bulge > 0 ? 1 : -1
  center = mid + sign * perp * offset
  
  // Start angle from center to v1
  startAngle = atan2(v1.y - cy, v1.x - cx)
  
  // Sweep direction: positive bulge = CCW (+theta), negative = CW (-theta)
  sweepAngle = bulge > 0 ? theta : -theta
  
  // Generate arc segments stepping from startAngle by sweepAngle
```

Closing segment fix:

```text
if (e.shape && verts.length > 0):
  last = verts[length - 1]
  first = verts[0]
  if last.bulge:
    addBulgeArc(last, first, last.bulge)
  else:
    addLine(last, first)
```
