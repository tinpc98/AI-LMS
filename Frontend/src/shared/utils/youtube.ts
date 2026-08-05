/**
 * YouTube Utility - Xử lý URL YouTube an toàn, trích xuất Video ID và Timestamp
 */

const YOUTUBE_WHITELIST_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export interface YouTubeParsedResult {
  videoId: string;
  startSeconds?: number;
}

/**
 * Chuyển đổi chuỗi mốc thời gian dạng '90', '90s', '1m30s', '1h2m3s' sang số giây
 */
export function parseYouTubeTimestamp(timeStr: string | null): number | undefined {
  if (!timeStr) return undefined;

  const trimmed = timeStr.trim();
  if (/^\d+$/.test(trimmed)) {
    const secs = parseInt(trimmed, 10);
    return isNaN(secs) || secs < 0 ? undefined : secs;
  }

  // Regex parse h, m, s: e.g. 1h30m20s, 2m15s, 45s
  let totalSeconds = 0;
  let hasMatch = false;

  const hoursMatch = trimmed.match(/(\d+)h/i);
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    hasMatch = true;
  }

  const minsMatch = trimmed.match(/(\d+)m/i);
  if (minsMatch) {
    totalSeconds += parseInt(minsMatch[1], 10) * 60;
    hasMatch = true;
  }

  const secsMatch = trimmed.match(/(\d+)s/i);
  if (secsMatch) {
    totalSeconds += parseInt(secsMatch[1], 10);
    hasMatch = true;
  }

  return hasMatch ? totalSeconds : undefined;
}

/**
 * Phân tích và trích xuất Video ID từ các định dạng URL YouTube
 * Chỉ chấp nhận domain thuộc whitelist (youtube.com, youtu.be, ...)
 * Tự động loại bỏ các tham số playlist/radio (list, start_radio)
 */
export function parseYouTubeUrl(rawUrl: string | undefined | null): YouTubeParsedResult | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Kiểm tra Whitelist domain nghiêm ngặt
    if (!YOUTUBE_WHITELIST_HOSTS.has(hostname)) {
      return null;
    }

    let videoId: string | null = null;
    let startSeconds: number | undefined = undefined;

    // 2. Trích xuất thời gian bắt đầu
    const tParam = parsed.searchParams.get("t") || parsed.searchParams.get("start");
    if (tParam) {
      startSeconds = parseYouTubeTimestamp(tParam);
    }

    // 3. Phân tích theo từng dạng URL
    if (hostname === "youtu.be") {
      // Dạng rút gọn: https://youtu.be/<VIDEO_ID>?t=10s
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        videoId = pathParts[0];
      }
    } else {
      // Dạng youtube.com / www.youtube.com / m.youtube.com
      const pathname = parsed.pathname;

      if (pathname === "/watch") {
        // Dạng watch: https://www.youtube.com/watch?v=<VIDEO_ID>&list=RDALzPt-7pEOc&start_radio=1
        // Lấy v=, các param khác như list/start_radio tự động bị bỏ qua
        videoId = parsed.searchParams.get("v");
      } else if (pathname.startsWith("/shorts/")) {
        // Dạng shorts: https://www.youtube.com/shorts/<VIDEO_ID>
        const parts = pathname.split("/shorts/")[1]?.split("/").filter(Boolean);
        if (parts && parts.length > 0) {
          videoId = parts[0];
        }
      } else if (pathname.startsWith("/embed/")) {
        // Dạng embed: https://www.youtube.com/embed/<VIDEO_ID>
        const parts = pathname.split("/embed/")[1]?.split("/").filter(Boolean);
        if (parts && parts.length > 0) {
          videoId = parts[0];
        }
      }
    }

    // 4. Validate YouTube Video ID (chuỗi 11 ký tự chữ cái, số, gạch dưới, gạch ngang)
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return {
        videoId,
        ...(startSeconds !== undefined && startSeconds > 0 ? { startSeconds } : {}),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem URL có phải là liên kết video YouTube hợp lệ hay không
 */
export function isYouTubeUrl(url: string | undefined | null): boolean {
  return parseYouTubeUrl(url) !== null;
}
