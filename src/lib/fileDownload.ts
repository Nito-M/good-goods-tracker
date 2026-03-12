export function getFileNameFromUrl(url: string, fallback = "document.pdf") {
  try {
    const withoutQuery = url.split("?")[0];
    const fileName = decodeURIComponent(withoutQuery.substring(withoutQuery.lastIndexOf("/") + 1));
    return fileName || fallback;
  } catch {
    return fallback;
  }
}

function buildForcedDownloadUrl(url: string, fileName: string) {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    parsedUrl.searchParams.set("download", fileName);
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export async function downloadFileFromUrl(url: string, fileName: string) {
  try {
    // Fetch as blob to create a same-origin object URL
    // This is required for mobile Safari where the download attribute
    // doesn't work on cross-origin URLs
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.rel = "noopener noreferrer";
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    return true;
  } catch (error) {
    console.error("Failed to download file:", error);
    // Final fallback: open in new tab so user can long-press to save
    window.open(url, "_blank", "noopener,noreferrer");
    return false;
  }
}
