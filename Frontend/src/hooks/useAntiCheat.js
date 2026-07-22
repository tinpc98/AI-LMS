import { useEffect, useRef } from "react";

const useAntiCheat = (onCheatDetected) => {
  const warningCount = useRef(0);
  const lastTriggerTime = useRef(0); // Thêm biến lưu thời gian để chống tính đúp

  useEffect(() => {
    // Tạo 1 hàm chung để tăng biến đếm và gọi Modal
    const triggerWarning = (reason) => {
      const now = Date.now();

      // FIX LỖI TÍNH ĐÚP: Nếu 2 sự kiện gian lận xảy ra cách nhau dưới 1 giây (1000ms), bỏ qua sự kiện thứ 2.
      if (now - lastTriggerTime.current < 1000) {
        return;
      }

      lastTriggerTime.current = now;
      warningCount.current += 1;
      onCheatDetected(reason, warningCount.current);
    };

    const handleContextMenu = (e) => e.preventDefault();

    const handleClipboard = (e) => {
      e.preventDefault();
      triggerWarning("Phát hiện hành vi sao chép/dán");
    };

    const handleKeyDown = (e) => {
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
  }, [onCheatDetected]);
};

export default useAntiCheat;
