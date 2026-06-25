import React, { useState, useEffect } from "react";

const ExamPage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>("C");
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [timer, setTimer] = useState(45 * 60 + 22);

  // Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tab Blur Detection
  useEffect(() => {
    const handleBlur = () => setIsWarningVisible(true);
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen overflow-hidden">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-8 z-50">
        <span className="font-bold text-xl text-primary">Academia AI Pro</span>
        <div className="flex items-center gap-6">
          <div className="bg-primary px-6 py-2 rounded-xl text-white font-mono text-xl shadow-lg flex items-center gap-2">
            <span>{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      <main className="pt-16 h-screen flex">
        {/* Left Panel */}
        <section className="flex-1 overflow-y-auto p-8 pb-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">
              Câu 12: Độ phức tạp thời gian của Quick Sort trường hợp xấu nhất?
            </h2>

            <div className="grid gap-4">
              {["A", "B", "C", "D"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedOption(opt)}
                  className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${
                    selectedOption === opt
                      ? "border-primary bg-secondary-container shadow-sm"
                      : "border-outline-variant"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      selectedOption === opt
                        ? "bg-primary text-white"
                        : "bg-surface-container"
                    }`}
                  >
                    {opt}
                  </div>
                  <span className="font-medium">Option {opt} content...</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="w-[280px] bg-surface-container-low border-l border-outline-variant p-6">
          <h3 className="font-bold mb-4">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 11 ? "border-2 border-primary" : "bg-primary text-white"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </aside>
      </main>

      {/* Warning Modal */}
      {isWarningVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-surface p-8 rounded-2xl max-w-sm text-center border border-error">
            <h3 className="text-xl font-bold text-error mb-4">
              Cảnh báo vi phạm!
            </h3>
            <p className="mb-6">Hệ thống ghi nhận bạn đã rời khỏi tab thi.</p>
            <button
              onClick={() => setIsWarningVisible(false)}
              className="px-6 py-2 bg-primary text-white rounded-lg"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
