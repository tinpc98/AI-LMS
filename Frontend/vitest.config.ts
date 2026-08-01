/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Cấu hình test tách RIÊNG khỏi vite.config.ts để việc build production không phải nạp
// bất kỳ thứ gì liên quan tới test.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Không chạy song song nhiều luồng: các test mount cả cây router và dùng chung
    // localStorage giả lập, chạy song song sẽ giẫm lên nhau.
    // (Vitest 4 đưa poolOptions lên cấp cao nhất, không còn lồng trong test.poolOptions.)
    pool: "threads",
    maxWorkers: 1,
    minWorkers: 1,
  },
});
