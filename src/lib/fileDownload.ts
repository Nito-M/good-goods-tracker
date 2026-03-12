const IOS_USER_AGENT_REGEX = /iPad|iPhone|iPod/;

function isIOSDevice() {
  return typeof navigator !== "undefined" && IOS_USER_AGENT_REGEX.test(navigator.userAgent);
}

async function tryShareFile(blob: Blob, fileName: string) {
  if (typeof navigator === "undefined" || !("share" in navigator)) {
    return false;
  }

  try {
    const file = new File([blob], fileName, {
      type: blob.type || "application/pdf",
      lastModified: Date.now(),
    });

    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };

    if (nav.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return true;
    }
  } catch (error) {
    console.error("Share failed, falling back to download:", error);
  }

  return false;
}

export function getFileNameFromUrl(url: string, fallback = "document.pdf") {
  try {
    const withoutQuery = url.split("?")[0];
    const fileName = decodeURIComponent(withoutQuery.substring(withoutQuery.lastIndexOf("/") + 1));
    return fileName || fallback;
  } catch {
    return fallback;
  }
}

export async function downloadFileFromUrl(url: string, fileName: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();

    if (await tryShareFile(blob, fileName)) {
      return true;
    }

    const objectUrl = URL.createObjectURL(blob);

    if (isIOSDevice()) {
      // iOS Safari/POS webviews often ignore the download attribute.
      // Navigating directly to the blob lets users Save/Share the file.
      window.location.assign(objectUrl);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return true;
    }

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.rel = "noopener noreferrer";
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(objectUrl), 5_000);
    return true;
  } catch (error) {
    console.error("Failed to download file:", error);
    // Always navigate as final fallback (works better than popup on mobile/POS)
    window.location.assign(url);
    return false;
  }
}

