import { useMemo, useEffect, useRef, useState } from 'react';
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
              const startAngle = Math.atan2(v1.y - cy, v1.x - cx);
              const sweepAngle = bulge > 0 ? theta : -theta;
              const segments = 32;
              const step = sweepAngle / segments;
              for (let s = 0; s < segments; s++) {
                const a1 = startAngle + step * s;
                const a2 = startAngle + step * (s + 1);
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
              // Close if shape is closed
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
            const startAngle = e.startAngle || 0;
            const endAngle = e.endAngle || Math.PI * 2;
            const segments = 64;
            let angle = endAngle - startAngle;
            if (angle < 0) angle += Math.PI * 2;
            const step = angle / segments;
            for (let i = 0; i < segments; i++) {
              const t1 = startAngle + step * i;
              const t2 = startAngle + step * (i + 1);
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

function DxfScene({ geometry, controlsRef }: { geometry: ParsedGeometry; controlsRef: React.MutableRefObject<any> }) {
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
      <lineBasicMaterial color="#ffffff" linewidth={1} />
    </lineSegments>
  );
}

function ZoomControls({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const { camera } = useThree();

  const handleZoom = (factor: number) => {
    const cam = camera as THREE.OrthographicCamera;
    const scale = factor;
    cam.left *= scale;
    cam.right *= scale;
    cam.top *= scale;
    cam.bottom *= scale;
    cam.updateProjectionMatrix();
    if (controlsRef.current) controlsRef.current.update();
  };

  return null; // Controls are rendered outside Canvas
}

export function DxfThreeViewer({ dxfText }: DxfThreeViewerProps) {
  const geometry = useMemo(() => parseDxfToGeometry(dxfText), [dxfText]);
  const controlsRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleZoom = (factor: number) => {
    // Access the Three.js state through the canvas
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

  return (
    <div className="w-full h-full relative" style={{ minHeight: 400 }}>
      <Canvas
        ref={canvasRef}
        orthographic
        camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 1000 }}
        style={{ width: '100%', height: '100%', background: '#1a1a2e' }}
        gl={{ antialias: true }}
      >
        <DxfScene geometry={geometry} controlsRef={controlsRef} />
        <MapControls ref={controlsRef} enableRotate={false} mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} />
      </Canvas>
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
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
