import { useEffect, useRef } from "react";

export type AntiCheatCallback = (reason: string, currentViolations: number) => void;

const useAntiCheat = (onCheatDetected: AntiCheatCallback) => {
  const warningCount = useRef(0);
  const lastTriggerTime = useRef(0);

  useEffect(() => {
    const triggerWarning = (reason: string) => {
      const now = Date.now();

      if (now - lastTriggerTime.current < 1000) {
        return;
      }

      lastTriggerTime.current = now;
      warningCount.current += 1;
      onCheatDetected(reason, warningCount.current);
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
  }, [onCheatDetected]);
};

export default useAntiCheat;
