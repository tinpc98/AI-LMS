// TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 1) — logic tính toán THUẦN, không đụng DB, mirror cách
// tách attendanceEvidence.js: dễ test, và attendance.service.js/lesson.progress logic chỉ còn
// việc đọc/ghi.
export const VIDEO_WATCH_THRESHOLD = 0.8; // BR-1.5: xem ≥80% thời lượng
export const DOCUMENT_MIN_OPEN_SECONDS = 30; // ≥30 giây
export const QUIZ_PASS_THRESHOLD = 70; // ≥70% số câu đúng (thang 0-100)

/**
 * Hợp nhất (union) các đoạn [start,end] đã xem (giây, tính theo currentTime video) — tua đi
 * tua lại hoặc xem trùng đoạn không được cộng dồn 2 lần (BR-1.4).
 */
export const computeWatchedUnionSeconds = (ranges) => {
  if (!Array.isArray(ranges) || ranges.length === 0) return 0;

  const sorted = ranges
    .map((r) => ({ start: Math.max(0, r.start), end: Math.max(0, r.end) }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  if (sorted.length === 0) return 0;

  let total = 0;
  let curStart = sorted[0].start;
  let curEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.start <= curEnd) {
      curEnd = Math.max(curEnd, r.end);
    } else {
      total += curEnd - curStart;
      curStart = r.start;
      curEnd = r.end;
    }
  }
  total += curEnd - curStart;

  return total;
};

export const isVideoBlockComplete = (watchedSeconds, durationSeconds) => {
  if (!durationSeconds || durationSeconds <= 0) return false;
  return watchedSeconds / durationSeconds >= VIDEO_WATCH_THRESHOLD;
};

export const isDocumentBlockComplete = (totalOpenSeconds) =>
  totalOpenSeconds >= DOCUMENT_MIN_OPEN_SECONDS;

export const isQuizBlockComplete = (bestScorePercent) =>
  bestScorePercent !== null &&
  bestScorePercent !== undefined &&
  bestScorePercent >= QUIZ_PASS_THRESHOLD;

/**
 * Tính lại completed/progress toàn Lesson từ danh sách block thật (Lesson.blocks) và tiến độ
 * từng block (LessonProgress.blocks).
 *
 * BR-1.3: Lesson không có block bắt buộc nào -> tự động COMPLETED ngay khi mở lần đầu.
 * BR-1.5: chỉ xét block BẮT BUỘC.
 * BR-1.7/BR-1.8: hàm này KHÔNG tự thu hồi completed đã true — caller chịu trách nhiệm không
 * gọi lại hàm này (giữ nguyên giá trị cũ) một khi đã completed, xem
 * lessonProgress.service.js#recomputeLessonCompletion.
 */
export const computeLessonCompletion = (lessonBlocks, blockProgressList) => {
  const requiredBlocks = (lessonBlocks || []).filter((b) => b.isRequired !== false);

  if (requiredBlocks.length === 0) {
    return { completed: true, progress: 100 };
  }

  const progressByBlockId = new Map(
    (blockProgressList || []).map((bp) => [String(bp.blockId), bp])
  );

  let completedCount = 0;
  for (const block of requiredBlocks) {
    const bp = progressByBlockId.get(String(block._id));
    if (bp?.completed) completedCount++;
  }

  const progress = Math.round((completedCount / requiredBlocks.length) * 100);
  return { completed: completedCount === requiredBlocks.length, progress };
};
