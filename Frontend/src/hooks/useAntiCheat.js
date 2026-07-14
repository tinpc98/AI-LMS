import { useEffect, useRef } from "react";

const useAntiCheat = (onCheatDetected) => {
  const warningCount = useRef(0);

  useEffect(() => {
    // Tạo 1 hàm chung để tăng biến đếm và gọi Modal
    const triggerWarning = (reason) => {
      warningCount.current += 1;
      onCheatDetected(reason, warningCount.current);
    };

    const handleContextMenu = (e) => e.preventDefault();

    const handleClipboard = (e) => {
      e.preventDefault();
      // Đổi từ alert() sang triggerWarning
      triggerWarning("Phát hiện hành vi sao chép/dán");
    };

    const handleKeyDown = (e) => {
      if (e.key === "F12") e.preventDefault();
      if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
        // Đổi từ alert() sang triggerWarning
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
