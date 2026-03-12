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

export function downloadFileFromUrl(url: string, fileName: string) {
  const forcedDownloadUrl = buildForcedDownloadUrl(url, fileName);

  try {
    const link = document.createElement("a");
    link.href = forcedDownloadUrl;
    link.download = fileName;
    link.rel = "noopener noreferrer";
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("Failed to trigger file download:", error);
    window.location.assign(forcedDownloadUrl);
    return false;
  }
}
