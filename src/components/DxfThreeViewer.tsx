import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import DxfParser from 'dxf-parser';

interface DxfThreeViewerProps {
  dxfText: string;
  bgMode?: 'dark' | 'white';
}

interface ParsedGeometry {
  positions: Float32Array;
  boundingBox: THREE.Box3;
}

interface MeasurePoint {
  world: { x: number; y: number };
  screen: { x: number; y: number };
}

interface Measurement {
  p1: MeasurePoint;
  p2: MeasurePoint;
  distance: number;
}

function parseDxfToGeometry(dxfText: string): ParsedGeometry {
  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfText);

  const allPoints: number[] = [];

  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    allPoints.push(x1, y1, 0, x2, y2, 0);
  };

  const addCirclePoints = (cx: number, cy: number, r: number, startAngle = 0, endAngle = Math.PI * 2, segments = 64) => {
    let angle = endAngle - startAngle;
    if (angle < 0) angle += Math.PI * 2;
    const step = angle / segments;
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + step * i;
      const a2 = startAngle + step * (i + 1);
      addLine(
        cx + r * Math.cos(a1), cy + r * Math.sin(a1),
        cx + r * Math.cos(a2), cy + r * Math.sin(a2)
      );
    }
  };

  if (dxf?.entities) {
    for (const entity of dxf.entities) {
      try {
        switch (entity.type) {
          case 'LINE': {
            const e = entity as any;
            if (e.vertices && e.vertices.length >= 2) {
              addLine(e.vertices[0].x, e.vertices[0].y, e.vertices[1].x, e.vertices[1].y);
            }
          } break;

          case 'CIRCLE': {
            const e = entity as any;
            addCirclePoints(e.center?.x || 0, e.center?.y || 0, e.radius || 1);
          } break;

          case 'ARC': {
            const e = entity as any;
            const startAngle = (e.startAngle || 0) * Math.PI / 180;
            const endAngle = (e.endAngle || 360) * Math.PI / 180;
            addCirclePoints(e.center?.x || 0, e.center?.y || 0, e.radius || 1, startAngle, endAngle, 64);
          } break;

          case 'LWPOLYLINE':
          case 'POLYLINE': {
            const e = entity as any;
            const verts = e.vertices;

            const addBulgeArc = (v1: any, v2: any, bulge: number) => {
              const theta = 4 * Math.atan(Math.abs(bulge));
              const dx = v2.x - v1.x;
              const dy = v2.y - v1.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 1e-10) return;
              const r = dist / (2 * Math.sin(theta / 2));
              const midX = (v1.x + v2.x) / 2;
              const midY = (v1.y + v2.y) / 2;
              const perpX = -dy / dist;
              const perpY = dx / dist;
              const offset = r * Math.cos(theta / 2);
              const sign = bulge > 0 ? 1 : -1;
              const cx = midX + sign * perpX * offset;
              const cy = midY + sign * perpY * offset;
              const sAngle = Math.atan2(v1.y - cy, v1.x - cx);
              const sweepAngle = bulge > 0 ? theta : -theta;
              const segs = 32;
              const stp = sweepAngle / segs;
              for (let s = 0; s < segs; s++) {
                const a1 = sAngle + stp * s;
                const a2 = sAngle + stp * (s + 1);
                addLine(
                  cx + Math.abs(r) * Math.cos(a1), cy + Math.abs(r) * Math.sin(a1),
                  cx + Math.abs(r) * Math.cos(a2), cy + Math.abs(r) * Math.sin(a2)
                );
              }
            };

            if (verts && verts.length >= 2) {
              for (let i = 0; i < verts.length - 1; i++) {
                const v1 = verts[i];
                const v2 = verts[i + 1];
                if (v1.bulge && v1.bulge !== 0) {
                  addBulgeArc(v1, v2, v1.bulge);
                } else {
                  addLine(v1.x, v1.y, v2.x, v2.y);
                }
              }
              if (e.shape) {
                const last = verts[verts.length - 1];
                const first = verts[0];
                if (last.bulge && last.bulge !== 0) {
                  addBulgeArc(last, first, last.bulge);
                } else {
                  addLine(last.x, last.y, first.x, first.y);
                }
              }
            }
          } break;

          case 'ELLIPSE': {
            const e = entity as any;
            const cx = e.center?.x || 0;
            const cy = e.center?.y || 0;
            const mx = e.majorAxisEndPoint?.x || 1;
            const my = e.majorAxisEndPoint?.y || 0;
            const ratio = e.axisRatio || 1;
            const a = Math.sqrt(mx * mx + my * my);
            const b = a * ratio;
            const rotation = Math.atan2(my, mx);
            const sAngle = e.startAngle || 0;
            const eAngle = e.endAngle || Math.PI * 2;
            const segments = 64;
            let angle = eAngle - sAngle;
            if (angle < 0) angle += Math.PI * 2;
            const step = angle / segments;
            for (let i = 0; i < segments; i++) {
              const t1 = sAngle + step * i;
              const t2 = sAngle + step * (i + 1);
              const x1 = cx + a * Math.cos(t1) * Math.cos(rotation) - b * Math.sin(t1) * Math.sin(rotation);
              const y1 = cy + a * Math.cos(t1) * Math.sin(rotation) + b * Math.sin(t1) * Math.cos(rotation);
              const x2 = cx + a * Math.cos(t2) * Math.cos(rotation) - b * Math.sin(t2) * Math.sin(rotation);
              const y2 = cy + a * Math.cos(t2) * Math.sin(rotation) + b * Math.sin(t2) * Math.cos(rotation);
              addLine(x1, y1, x2, y2);
            }
          } break;

          case 'SPLINE': {
            const e = entity as any;
            const pts = e.controlPoints || e.fitPoints;
            if (pts && pts.length >= 2) {
              for (let i = 0; i < pts.length - 1; i++) {
                addLine(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
              }
            }
          } break;

          default:
            break;
        }
      } catch {
        // Skip malformed entities
      }
    }
  }

  const positions = new Float32Array(allPoints);
  const boundingBox = new THREE.Box3();
  for (let i = 0; i < positions.length; i += 3) {
    boundingBox.expandByPoint(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
  }

  return { positions, boundingBox };
}

function DxfScene({ geometry, controlsRef, lineColor }: { geometry: ParsedGeometry; controlsRef: React.MutableRefObject<any>; lineColor: string }) {
  const { camera, gl } = useThree();
  const linesRef = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    if (geometry.positions.length === 0) return;

    const box = geometry.boundingBox;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const canvas = gl.domElement;
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const padding = 1.1;
    const drawingW = (size.x || 1) * padding;
    const drawingH = (size.y || 1) * padding;

    let halfW: number, halfH: number;
    if (drawingW / drawingH > aspect) {
      halfW = drawingW / 2;
      halfH = halfW / aspect;
    } else {
      halfH = drawingH / 2;
      halfW = halfH * aspect;
    }

    const cam = camera as THREE.OrthographicCamera;
    cam.left = -halfW;
    cam.right = halfW;
    cam.top = halfH;
    cam.bottom = -halfH;
    cam.position.set(center.x, center.y, 100);
    cam.lookAt(center.x, center.y, 0);
    cam.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(center.x, center.y, 0);
      controlsRef.current.update();
    }
  }, [geometry, camera, controlsRef]);

  const bufferGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(geometry.positions, 3));
    return geo;
  }, [geometry]);

  if (geometry.positions.length === 0) return null;

  return (
    <lineSegments ref={linesRef} geometry={bufferGeometry}>
      <lineBasicMaterial color={lineColor} linewidth={1} />
    </lineSegments>
  );
}

// Helper: convert mouse event to world coordinates using the Three.js camera
function screenToWorld(canvasEl: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } | null {
  const state = (canvasEl as any).__r3f;
  if (!state) return null;
  const cam = state.camera as THREE.OrthographicCamera;
  const rect = canvasEl.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
  const vec = new THREE.Vector3(ndcX, ndcY, 0).unproject(cam);
  return { x: vec.x, y: vec.y };
}

function worldToScreen(canvasEl: HTMLCanvasElement, wx: number, wy: number): { x: number; y: number } | null {
  const state = (canvasEl as any).__r3f;
  if (!state) return null;
  const cam = state.camera as THREE.OrthographicCamera;
  const vec = new THREE.Vector3(wx, wy, 0).project(cam);
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: (vec.x + 1) / 2 * rect.width,
    y: (-vec.y + 1) / 2 * rect.height,
  };
}

// Snap to nearest geometry vertex within threshold
function snapToGeometry(positions: Float32Array, worldPt: { x: number; y: number }, snapThreshold: number): { x: number; y: number } {
  let bestDist = snapThreshold;
  let snapped = worldPt;
  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - worldPt.x;
    const dy = positions[i + 1] - worldPt.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) {
      bestDist = d;
      snapped = { x: positions[i], y: positions[i + 1] };
    }
  }
  return snapped;
}

export function DxfThreeViewer({ dxfText }: DxfThreeViewerProps) {
  const geometry = useMemo(() => parseDxfToGeometry(dxfText), [dxfText]);
  const controlsRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgMode, setBgMode] = useState<'dark' | 'white'>('white');
  const [measuring, setMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<MeasurePoint | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [cursorScreen, setCursorScreen] = useState<{ x: number; y: number } | null>(null);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);

  const bgColor = bgMode === 'dark' ? '#1a1a2e' : '#ffffff';
  const lineColor = bgMode === 'dark' ? '#ffffff' : '#000000';
  const measureColor = '#ef4444';

  const handleZoom = (factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = (canvas as any).__r3f;
    if (!state) return;
    const cam = state.camera as THREE.OrthographicCamera;
    cam.left *= factor;
    cam.right *= factor;
    cam.top *= factor;
    cam.bottom *= factor;
    cam.updateProjectionMatrix();
    if (controlsRef.current) controlsRef.current.update();
  };

  // Compute snap threshold based on current view size
  const getSnapThreshold = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 5;
    const state = (canvas as any).__r3f;
    if (!state) return 5;
    const cam = state.camera as THREE.OrthographicCamera;
    const viewWidth = cam.right - cam.left;
    return viewWidth * 0.02; // 2% of view
  }, []);

  const handleMeasureClick = useCallback((e: React.MouseEvent) => {
    if (!measuring || !canvasRef.current) return;
    const world = screenToWorld(canvasRef.current, e.clientX, e.clientY);
    if (!world) return;

    const snapped = snapToGeometry(geometry.positions, world, getSnapThreshold());
    const rect = canvasRef.current.getBoundingClientRect();
    const screenPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (!measureStart) {
      setMeasureStart({ world: snapped, screen: screenPt });
    } else {
      const dx = snapped.x - measureStart.world.x;
      const dy = snapped.y - measureStart.world.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      setMeasurements(prev => [...prev, {
        p1: measureStart,
        p2: { world: snapped, screen: screenPt },
        distance,
      }]);
      setMeasureStart(null);
    }
  }, [measuring, measureStart, geometry.positions, getSnapThreshold]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!measuring || !measureStart || !canvasRef.current) {
      setCursorScreen(null);
      setCursorWorld(null);
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    setCursorScreen({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const world = screenToWorld(canvasRef.current, e.clientX, e.clientY);
    if (world) {
      setCursorWorld(snapToGeometry(geometry.positions, world, getSnapThreshold()));
    }
  }, [measuring, measureStart, geometry.positions, getSnapThreshold]);

  const toggleMeasure = () => {
    if (measuring) {
      setMeasuring(false);
      setMeasureStart(null);
      setMeasurements([]);
      setCursorScreen(null);
      setCursorWorld(null);
    } else {
      setMeasuring(true);
    }
  };

  // Update screen positions of measurements on camera changes (zoom/pan)
  const updateMeasurementScreenPositions = useCallback(() => {
    if (!canvasRef.current || measurements.length === 0) return;
    setMeasurements(prev => prev.map(m => {
      const s1 = worldToScreen(canvasRef.current!, m.p1.world.x, m.p1.world.y);
      const s2 = worldToScreen(canvasRef.current!, m.p2.world.x, m.p2.world.y);
      if (!s1 || !s2) return m;
      return { ...m, p1: { ...m.p1, screen: s1 }, p2: { ...m.p2, screen: s2 } };
    }));
  }, [measurements.length]);

  // Also update the start point screen position
  const getStartScreenPos = useCallback(() => {
    if (!measureStart || !canvasRef.current) return null;
    return worldToScreen(canvasRef.current, measureStart.world.x, measureStart.world.y);
  }, [measureStart]);

  // Refresh screen positions periodically while measuring (handles pan/zoom)
  useEffect(() => {
    if (!measuring) return;
    const interval = setInterval(() => {
      updateMeasurementScreenPositions();
    }, 100);
    return () => clearInterval(interval);
  }, [measuring, updateMeasurementScreenPositions]);

  const startScreenPos = getStartScreenPos();

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: 400 }}>
      <Canvas
        ref={canvasRef}
        orthographic
        camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 1000 }}
        style={{ width: '100%', height: '100%', background: bgColor, cursor: measuring ? 'crosshair' : 'grab' }}
        gl={{ antialias: true }}
      >
        <DxfScene geometry={geometry} controlsRef={controlsRef} lineColor={lineColor} />
        <MapControls ref={controlsRef} enableRotate={false} enabled={!measuring} mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} />
      </Canvas>

      {/* Measure overlay */}
      {measuring && (
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ zIndex: 10 }}
          onClick={handleMeasureClick}
          onMouseMove={handleMouseMove}
        >
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {/* Completed measurements */}
            {measurements.map((m, i) => {
              const midX = (m.p1.screen.x + m.p2.screen.x) / 2;
              const midY = (m.p1.screen.y + m.p2.screen.y) / 2;
              return (
                <g key={i}>
                  <line x1={m.p1.screen.x} y1={m.p1.screen.y} x2={m.p2.screen.x} y2={m.p2.screen.y}
                    stroke={measureColor} strokeWidth={2} strokeDasharray="6 3" />
                  <circle cx={m.p1.screen.x} cy={m.p1.screen.y} r={4} fill={measureColor} />
                  <circle cx={m.p2.screen.x} cy={m.p2.screen.y} r={4} fill={measureColor} />
                  <rect x={midX - 36} y={midY - 12} width={72} height={20} rx={4} fill="rgba(0,0,0,0.8)" />
                  <text x={midX} y={midY + 2} textAnchor="middle" fill="white" fontSize={11} fontFamily="monospace">
                    {m.distance.toFixed(2)}
                  </text>
                </g>
              );
            })}
            {/* Active measurement line */}
            {measureStart && cursorScreen && startScreenPos && (
              <g>
                <line x1={startScreenPos.x} y1={startScreenPos.y} x2={cursorScreen.x} y2={cursorScreen.y}
                  stroke={measureColor} strokeWidth={1.5} strokeDasharray="4 4" />
                <circle cx={startScreenPos.x} cy={startScreenPos.y} r={4} fill={measureColor} />
                <circle cx={cursorScreen.x} cy={cursorScreen.y} r={3} fill={measureColor} fillOpacity={0.6} />
                {cursorWorld && (() => {
                  const dx = cursorWorld.x - measureStart.world.x;
                  const dy = cursorWorld.y - measureStart.world.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const mx = (startScreenPos.x + cursorScreen.x) / 2;
                  const my = (startScreenPos.y + cursorScreen.y) / 2;
                  return (
                    <>
                      <rect x={mx - 36} y={my - 12} width={72} height={20} rx={4} fill="rgba(0,0,0,0.7)" />
                      <text x={mx} y={my + 2} textAnchor="middle" fill="white" fontSize={11} fontFamily="monospace">
                        {dist.toFixed(2)}
                      </text>
                    </>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex gap-1" style={{ zIndex: 20 }}>
        <button
          onClick={toggleMeasure}
          className={`px-3 h-8 rounded-md backdrop-blur border border-border flex items-center justify-center hover:bg-accent transition-colors text-xs font-medium gap-1.5 ${measuring ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/80 text-foreground'}`}
          title="Measure distance"
        >
          📏 {measuring ? 'Done' : 'Measure'}
        </button>
        <button
          onClick={() => setBgMode(bgMode === 'dark' ? 'white' : 'dark')}
          className="px-3 h-8 rounded-md bg-background/80 backdrop-blur border border-border text-foreground flex items-center justify-center hover:bg-accent transition-colors text-xs font-medium"
          title="Toggle background"
        >
          {bgMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Measure instructions */}
      {measuring && !measureStart && measurements.length === 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md bg-foreground/80 text-background text-xs font-medium" style={{ zIndex: 20 }}>
          Click two points to measure distance
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1" style={{ zIndex: 20 }}>
        <button
          onClick={() => handleZoom(0.8)}
          className="w-9 h-9 rounded-md bg-background/80 backdrop-blur border border-border text-foreground flex items-center justify-center hover:bg-accent transition-colors text-lg font-bold"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(1.25)}
          className="w-9 h-9 rounded-md bg-background/80 backdrop-blur border border-border text-foreground flex items-center justify-center hover:bg-accent transition-colors text-lg font-bold"
          title="Zoom Out"
        >
          −
        </button>
      </div>
    </div>
  );
}
