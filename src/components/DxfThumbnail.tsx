import { useEffect, useMemo, useRef } from 'react';
import DxfParser from 'dxf-parser';

interface DxfThumbnailProps {
  dxfText: string;
  className?: string;
}

export function DxfThumbnail({ dxfText, className }: DxfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lines = useMemo(() => {
    try {
      const parser = new DxfParser();
      const dxf = parser.parseSync(dxfText);
      const segments: [number, number, number, number][] = [];

      const addLine = (x1: number, y1: number, x2: number, y2: number) => {
        segments.push([x1, y1, x2, y2]);
      };

      const addArc = (cx: number, cy: number, r: number, sa = 0, ea = Math.PI * 2, n = 32) => {
        let a = ea - sa; if (a < 0) a += Math.PI * 2;
        const step = a / n;
        for (let i = 0; i < n; i++) {
          const a1 = sa + step * i, a2 = sa + step * (i + 1);
          addLine(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
        }
      };

      if (dxf?.entities) {
        for (const entity of dxf.entities) {
          try {
            const e = entity as any;
            switch (entity.type) {
              case 'LINE':
                if (e.vertices?.length >= 2) addLine(e.vertices[0].x, e.vertices[0].y, e.vertices[1].x, e.vertices[1].y);
                break;
              case 'CIRCLE':
                addArc(e.center?.x || 0, e.center?.y || 0, e.radius || 1);
                break;
              case 'ARC':
                addArc(e.center?.x || 0, e.center?.y || 0, e.radius || 1, (e.startAngle || 0) * Math.PI / 180, (e.endAngle || 360) * Math.PI / 180);
                break;
              case 'LWPOLYLINE':
              case 'POLYLINE':
                if (e.vertices?.length >= 2) {
                  for (let i = 0; i < e.vertices.length - 1; i++) addLine(e.vertices[i].x, e.vertices[i].y, e.vertices[i + 1].x, e.vertices[i + 1].y);
                  if (e.shape) addLine(e.vertices[e.vertices.length - 1].x, e.vertices[e.vertices.length - 1].y, e.vertices[0].x, e.vertices[0].y);
                }
                break;
              case 'ELLIPSE': {
                const cx = e.center?.x || 0, cy = e.center?.y || 0;
                const mx = e.majorAxisEndPoint?.x || 1, my = e.majorAxisEndPoint?.y || 0;
                const a = Math.sqrt(mx * mx + my * my), b = a * (e.axisRatio || 1);
                const rot = Math.atan2(my, mx);
                const sa = e.startAngle || 0, ea = e.endAngle || Math.PI * 2;
                let ang = ea - sa; if (ang < 0) ang += Math.PI * 2;
                const n = 32, step = ang / n;
                for (let i = 0; i < n; i++) {
                  const t1 = sa + step * i, t2 = sa + step * (i + 1);
                  addLine(
                    cx + a * Math.cos(t1) * Math.cos(rot) - b * Math.sin(t1) * Math.sin(rot),
                    cy + a * Math.cos(t1) * Math.sin(rot) + b * Math.sin(t1) * Math.cos(rot),
                    cx + a * Math.cos(t2) * Math.cos(rot) - b * Math.sin(t2) * Math.sin(rot),
                    cy + a * Math.cos(t2) * Math.sin(rot) + b * Math.sin(t2) * Math.cos(rot),
                  );
                }
                break;
              }
              case 'SPLINE': {
                const pts = e.controlPoints || e.fitPoints;
                if (pts?.length >= 2) for (let i = 0; i < pts.length - 1; i++) addLine(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
                break;
              }
            }
          } catch { /* skip */ }
        }
      }
      return segments;
    } catch { return []; }
  }, [dxfText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || lines.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x1, y1, x2, y2] of lines) {
      minX = Math.min(minX, x1, x2); minY = Math.min(minY, y1, y2);
      maxX = Math.max(maxX, x1, x2); maxY = Math.max(maxY, y1, y2);
    }

    const dw = maxX - minX || 1, dh = maxY - minY || 1;
    const pad = 0.1;
    const scale = Math.min(w * (1 - pad * 2) / dw, h * (1 - pad * 2) / dh);
    const ox = (w - dw * scale) / 2 - minX * scale;
    const oy = (h - dh * scale) / 2 + maxY * scale; // flip Y

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of lines) {
      ctx.moveTo(x1 * scale + ox, -y1 * scale + oy);
      ctx.lineTo(x2 * scale + ox, -y2 * scale + oy);
    }
    ctx.stroke();
  }, [lines]);

  if (lines.length === 0) return null;

  return <canvas ref={canvasRef} width={200} height={200} className={className || "w-full h-full object-contain"} />;
}
