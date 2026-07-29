/**
 * Utility định dạng ngày giờ cho Live Session
 */

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "---";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "---";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "---";
  }
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return "---";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "---";
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "---";
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return "---";
  return `${formatTime(dateString)} ${formatDate(dateString)}`;
}

export function calculateDuration(start?: string | null, end?: string | null): string {
  if (!start) return "---";
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  if (isNaN(startTime) || isNaN(endTime)) return "---";

  const diffMs = Math.max(0, endTime - startTime);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }
  return `${minutes} phút`;
}
