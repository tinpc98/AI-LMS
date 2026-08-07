import { useEffect, useRef } from "react";

export type AntiCheatCallback = (reason: string) => void;

const useAntiCheat = (onCheatDetected: AntiCheatCallback) => {
  const lastTriggerTime = useRef(0);

  // Giữ callback trong ref và đăng ký listener MỘT LẦN.
  //
  // Bản cũ đặt onCheatDetected vào mảng phụ thuộc của effect, nên mỗi lần nó đổi là gỡ và gắn
  // lại toàn bộ 7 listener. Để tránh việc đó, nơi gọi (ExamPage) phải bọc callback trong
  // useCallback với mảng phụ thuộc rỗng trên thực tế — và chính chỗ đó sinh ra một lỗi nghiêm
  // trọng: callback bị đóng băng ở lần render đầu, kéo theo toàn bộ state nó đọc.
  //
  // Ref thì luôn trỏ tới bản mới nhất mà không cần gắn lại listener. useExamTimer trong cùng
  // feature này đã làm đúng như vậy từ trước.
  const callbackRef = useRef(onCheatDetected);
  useEffect(() => {
    callbackRef.current = onCheatDetected;
  }, [onCheatDetected]);

  useEffect(() => {
    const triggerWarning = (reason: string) => {
      const now = Date.now();

      if (now - lastTriggerTime.current < 1000) {
        return;
      }

      lastTriggerTime.current = now;
      callbackRef.current(reason);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleClipboard = (e: Event) => {
      e.preventDefault();
      triggerWarning("Phát hiện hành vi sao chép/dán");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12") e.preventDefault();
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
        triggerWarning("Phát hiện hành vi tải lại trang (F5)");
      }
      if (e.ctrlKey && ["c", "v", "x"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerWarning("Phát hiện chuyển Tab hoặc thu nhỏ trình duyệt");
      }
    };

    const handleBlur = () => {
      triggerWarning("Click ra ngoài cửa sổ thi");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleClipboard);
    document.addEventListener("cut", handleClipboard);
    document.addEventListener("paste", handleClipboard);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleClipboard);
      document.removeEventListener("cut", handleClipboard);
      document.removeEventListener("paste", handleClipboard);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
    // Mảng rỗng: listener gắn một lần cho tới khi component rời đi. Callback mới nhất
    // luôn tới được qua callbackRef ở trên.
  }, []);
};

export default useAntiCheat;
