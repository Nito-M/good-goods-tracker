import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'boardClipboard';

export interface BoardClipboardEntry {
  sourceBoardId: string;
  sourceBoardName: string;
  sourceCompanyId: string | null;
  copiedAt: string;
}

function readClipboard(): BoardClipboardEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BoardClipboardEntry;
    if (!parsed?.sourceBoardId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useBoardClipboard() {
  const [clipboard, setClipboard] = useState<BoardClipboardEntry | null>(() => readClipboard());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setClipboard(readClipboard());
    };
    const onCustom = () => setClipboard(readClipboard());
    window.addEventListener('storage', onStorage);
    window.addEventListener('boardClipboard:change', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('boardClipboard:change', onCustom);
    };
  }, []);

  const copyToClipboard = useCallback(
    (board: { id: string; name: string; company_id: string | null }) => {
      const entry: BoardClipboardEntry = {
        sourceBoardId: board.id,
        sourceBoardName: board.name,
        sourceCompanyId: board.company_id,
        copiedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
      setClipboard(entry);
      window.dispatchEvent(new Event('boardClipboard:change'));
    },
    [],
  );

  const clear = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setClipboard(null);
    window.dispatchEvent(new Event('boardClipboard:change'));
  }, []);

  return { clipboard, copyToClipboard, clear };
}
