export interface DragPartData {
  name: string;
  sku: string;
  price: number;
  description: string | null;
  hours?: number;
  hourlyRate?: number;
  paintingHours?: number;
  paintingHourlyRate?: number;
  dxfLabel1?: string;
  dxfLabel2?: string;
}

const MIME = 'application/json';
const DRAG_TYPE_KEY = 'application/x-parts-library';

export function setPartDragData(e: React.DragEvent, part: DragPartData) {
  const json = JSON.stringify(part);
  e.dataTransfer.setData(MIME, json);
  e.dataTransfer.setData(DRAG_TYPE_KEY, 'true');
  e.dataTransfer.setData('text/plain', `${part.name} (${part.sku}) - $${part.price}`);

  // Enable drag-to-desktop as JSON file
  const safeName = (part.name || part.sku || 'part').replace(/[^a-zA-Z0-9_-]/g, '_');
  const b64 = btoa(unescape(encodeURIComponent(json)));
  e.dataTransfer.setData(
    'DownloadURL',
    `application/json:${safeName}.json:data:application/json;base64,${b64}`
  );

  e.dataTransfer.effectAllowed = 'copy';
}

export function getPartDropData(e: React.DragEvent): DragPartData | null {
  try {
    const raw = e.dataTransfer.getData(MIME);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.name && !data.sku) return null;
    return data as DragPartData;
  } catch {
    return null;
  }
}

export function isPartDrag(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(MIME);
}
