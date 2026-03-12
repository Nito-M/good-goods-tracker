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

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  } catch (error) {
    console.error("Failed to download file:", error);
    window.open(url, "_blank", "noopener,noreferrer");
    return false;
  }
}
