import type { ILesson } from "../../../interface/lessonInterface";

/**
 * Tách bỏ tiền tố 'Bài X:' hoặc 'Bài X -' khỏi chuỗi tiêu đề bài giảng nếu có
 */
export function cleanLessonTitle(rawTitle: string | undefined | null): string {
  if (!rawTitle) return "";
  return rawTitle.replace(/^bài\s*\d+\s*[:\-–]\s*/i, "").trim();
}

/**
 * Định dạng tiêu đề hiển thị chuẩn hóa cho bài giảng: 'Bài <Index + 1>: <CleanTitle>'
 */
export function formatLessonDisplayTitle(index: number, rawTitle: string): string {
  const clean = cleanLessonTitle(rawTitle);
  return clean ? `Bài ${index + 1}: ${clean}` : `Bài ${index + 1}`;
}

/**
 * Sắp xếp danh sách bài giảng theo thứ tự ổn định:
 * Ưu tiên trường 'order' tăng dần, nếu trùng thì xét theo 'createdAt' tăng dần.
 * Đồng thời kiểm tra cảnh báo console cho dev nếu phát hiện order trùng lặp trong CSDL.
 */
export function sortLessons(lessons: ILesson[] = []): ILesson[] {
  if (!Array.isArray(lessons) || lessons.length === 0) return [];

  // Tạo bản sao để sắp xếp
  const sorted = [...lessons].sort((a, b) => {
    const orderA = typeof a.order === "number" ? a.order : 0;
    const orderB = typeof b.order === "number" ? b.order : 0;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });

  // Kiểm tra order trùng lặp và ghi log cảnh báo developer
  if (process.env.NODE_ENV !== "production") {
    const seenOrders = new Map<number, string[]>();
    sorted.forEach((l) => {
      const ord = l.order ?? 0;
      if (!seenOrders.has(ord)) {
        seenOrders.set(ord, []);
      }
      seenOrders.get(ord)!.push(l.title);
    });

    const duplicates = Array.from(seenOrders.entries()).filter(([_, titles]) => titles.length > 1);
    if (duplicates.length > 0) {
      console.warn(
        "[AI-LMS Dev Warning] Phát hiện các bài giảng bị trùng giá trị 'order' trong cơ sở dữ liệu. Frontend tự động điều chỉnh số thứ tự hiển thị liên tục theo vị trí danh sách:",
        duplicates.map(([ord, titles]) => ({ order: ord, lessons: titles }))
      );
    }
  }

  return sorted;
}
