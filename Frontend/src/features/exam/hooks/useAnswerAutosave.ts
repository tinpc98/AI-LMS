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
  buildAnswers: () => DraftAnswer[],
  answersVersionRef: React.MutableRefObject<number>,
  sessionToken: string | null,
  isLoaded: boolean
) => {
  const buildRef = useRef(buildAnswers);
  useEffect(() => {
    buildRef.current = buildAnswers;
  }, [buildAnswers]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dangGuiRef = useRef(false);
  const needsAnotherSaveRef = useRef(false);

  const guiNgay = useCallback(async () => {
    if (!attemptId || !isLoaded) return;
    
    if (dangGuiRef.current) {
      needsAnotherSaveRef.current = true;
      return;
    }

    const answers = buildRef.current();
    if (answers.length === 0) return;

    dangGuiRef.current = true;
    needsAnotherSaveRef.current = false;
    
    try {
      const payload = { answers, answersVersion: answersVersionRef.current };
      const config = sessionToken ? { headers: { "x-session-token": sessionToken } } : {};
      const res = await axiosClient.patch(`/api/exam-attempts/${attemptId}/answers`, payload, config);
      if (res.data?.data?.newVersion !== undefined) {
        answersVersionRef.current = res.data.data.newVersion;
      }
    } catch (err: any) {
      if (err?.response?.data?.errorCode === "VERSION_MISMATCH") {
        try {
          // Xử lý 409 êm: GET lại version mới
          const getRes = await axiosClient.get(`/api/exam-attempts/${attemptId}`);
          const data = getRes.data.data || getRes.data;
          if (data && data.answersVersion !== undefined) {
            answersVersionRef.current = data.answersVersion;
            // Retry lại 1 lần duy nhất bằng cách gọi trực tiếp API
            const retryPayload = { answers, answersVersion: answersVersionRef.current };
            const config = sessionToken ? { headers: { "x-session-token": sessionToken } } : {};
            const retryRes = await axiosClient.patch(`/api/exam-attempts/${attemptId}/answers`, retryPayload, config);
            if (retryRes.data?.data?.newVersion !== undefined) {
              answersVersionRef.current = retryRes.data.data.newVersion;
            }
          }
        } catch (retryErr) {
          // Chỉ báo người dùng nếu lần retry cũng thất bại bằng Modal antd
          import("antd").then(({ Modal }) => {
            Modal.warning({
              title: "Lỗi đồng bộ bài làm",
              content: "Bài làm đã được cập nhật ở thiết bị hoặc tab khác. Vui lòng tải lại trang để đồng bộ và tiếp tục.",
              okText: "Tải lại trang",
              onOk: () => window.location.reload()
            });
          });
        }
      }
      // Các lỗi khác (mất mạng) thì kệ để localStorage làm điểm tựa
    } finally {
      dangGuiRef.current = false;
      if (needsAnotherSaveRef.current) {
        // Gọi lại để lưu những thay đổi mới phát sinh trong lúc đang PATCH
        void guiNgay();
      }
    }
  }, [attemptId, answersVersionRef, sessionToken, isLoaded]);

  /** Gọi mỗi khi câu trả lời đổi. Gom các lần gọi liên tiếp trong 1,5 giây. */
  const luuTam = useCallback(() => {
    if (!attemptId || !isLoaded) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void guiNgay(), DEBOUNCE_MS);
  }, [attemptId, guiNgay, isLoaded]);

  // Đẩy nốt khi rời trang. 
  useEffect(() => {
    const handleUnload = () => void guiNgay();
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isLoaded) {
        void guiNgay();
      }
    };
  }, [guiNgay, isLoaded]);

  return { luuTam, guiNgay };
};

export default useAnswerAutosave;
