import jsPDF from 'jspdf';

const IOS_RE = /iPad|iPhone|iPod/;

function isIOS(): boolean {
  return typeof navigator !== 'undefined' && IOS_RE.test(navigator.userAgent);
}

/**
 * Safari-compatible PDF save.
 * On iOS Safari, doc.save() silently fails. Instead we:
 *  1. Try navigator.share (native share sheet) – lets user AirDrop / Save to Files / etc.
 *  2. Fall back to opening the blob in a new tab so the user can use the share button.
 * On other browsers, use the standard anchor-click approach which is more reliable than doc.save().
 */
export async function savePdfBlob(doc: jsPDF, fileName: string): Promise<void> {
  const blob = doc.output('blob');

  // 1. Try Web Share API (works great on iOS 15+)
  if (isIOS() && typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      const file = new File([blob], fileName, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
        return;
      }
    } catch (err) {
      // User cancelled or share failed – fall through
      if ((err as DOMException)?.name === 'AbortError') return; // user cancelled
      console.warn('Share failed, falling back:', err);
    }
  }

  const objectUrl = URL.createObjectURL(blob);

  // 2. iOS fallback: open in new tab (shows Safari PDF viewer with share button)
  if (isIOS()) {
    window.location.assign(objectUrl);
    // Revoke after a generous delay so Safari can render
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
    return;
  }

  // 3. Standard browsers: anchor click download
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
