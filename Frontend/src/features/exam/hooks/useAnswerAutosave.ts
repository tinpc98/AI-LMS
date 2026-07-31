// Đẩy câu trả lời lên máy chủ ngay khi học sinh chọn.
//
// VÌ SAO BẮT BUỘC PHẢI CÓ
//
// Máy chủ tự động nộp bài khi hết giờ (cron chạy mỗi phút) và chấm theo những gì ĐÃ LƯU LÊN
// MÁY CHỦ. Trước đây bài làm chỉ nằm trong localStorage cho tới lúc bấm nộp — nghĩa là học
// sinh mất mạng phút cuối sẽ bị chấm với bài RỖNG dù đã làm xong.
//
// localStorage vẫn giữ lại: nó cứu được trường hợp tải lại trang khi mạng đang hỏng. Nhưng nó
// không còn là nơi duy nhất biết bài làm.
//
// CHỐNG DỘI, KHÔNG PHẢI CHỐNG MẤT
//
// Gửi ngay từng lần gõ chữ vào ô tự luận sẽ tạo một request mỗi ký tự. Nên gom trong một
// khoảng ngắn rồi mới gửi. Nhưng ĐỘ TRỄ NÀY LÀ RỦI RO THẬT: mất mạng đúng trong khoảng đó là
// mất câu vừa nhập. Vì vậy chọn 1,5 giây — đủ để gom một cụm gõ phím, đủ ngắn để phần mất
// không đáng kể — và luôn ĐẨY NỐT khi rời trang hoặc khi chuyển câu.
import { useCallback, useEffect, useRef } from "react";
import axiosClient from "../../../api/axiosClient";

const DEBOUNCE_MS = 1500;

export interface DraftAnswer {
  questionId: string;
  selectedOption?: string;
  essayText?: string;
}

/**
 * @param attemptId  Phiên làm bài. Không có thì hook không làm gì.
 * @param buildAnswers Hàm dựng danh sách câu trả lời hiện tại — nhận qua ref nên luôn đọc
 *                     state mới nhất, không bị đóng băng ở lần render đầu (bài học từ bug
 *                     nộp bài rỗng ở commit 3a395f0).
 */
export const useAnswerAutosave = (
  attemptId: string | undefined,
  buildAnswers: () => DraftAnswer[]
) => {
  const buildRef = useRef(buildAnswers);
  useEffect(() => {
    buildRef.current = buildAnswers;
  }, [buildAnswers]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dangGuiRef = useRef(false);

  const guiNgay = useCallback(async () => {
    if (!attemptId || dangGuiRef.current) return;

    const answers = buildRef.current();
    if (answers.length === 0) return;

    dangGuiRef.current = true;
    try {
      await axiosClient.patch(`/api/exam-attempts/${attemptId}/answers`, { answers });
    } catch {
      // Lưu tạm thất bại KHÔNG được làm gián đoạn việc thi. localStorage vẫn giữ bài, và lần
      // gõ tiếp theo sẽ thử lại. Hiện lỗi ở đây chỉ khiến học sinh hoảng giữa giờ thi.
    } finally {
      dangGuiRef.current = false;
    }
  }, [attemptId]);

  /** Gọi mỗi khi câu trả lời đổi. Gom các lần gọi liên tiếp trong 1,5 giây. */
  const luuTam = useCallback(() => {
    if (!attemptId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void guiNgay(), DEBOUNCE_MS);
  }, [attemptId, guiNgay]);

  // Đẩy nốt khi rời trang. Không có bước này thì phần đang chờ trong hàng đợi chống dội sẽ mất.
  useEffect(() => {
    const handleUnload = () => void guiNgay();
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (timerRef.current) clearTimeout(timerRef.current);
      void guiNgay();
    };
  }, [guiNgay]);

  return { luuTam, guiNgay };
};

export default useAnswerAutosave;
