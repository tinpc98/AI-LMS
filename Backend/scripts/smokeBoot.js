// File: scripts/smokeBoot.js
// Kiểm tra ứng dụng KHỞI ĐỘNG ĐƯỢC BẰNG NODE THẬT, không phải chỉ pass test.
//
// VÌ SAO CẦN: Vitest chạy qua Vite nên tự resolve "#modules/auth" thành thư mục ->
// index.js. Node ESM thì KHÔNG — nó ném ERR_UNSUPPORTED_DIR_IMPORT. Hệ quả là toàn bộ
// 371 test có thể xanh trong khi `node main.js` crash ngay lúc nạp module. Điều này đã
// xảy ra thật ở Wave 3.2 và lọt qua 6 commit, vì lúc đó tôi chỉ kiểm tra exit code
// (vẫn là 1) mà không đọc lý do — trùng với exit code của nhánh fail-fast khi mất DB.
//
// Script boot với MONGO_URI trỏ vào cổng chết và khẳng định tiến trình dừng ĐÚNG ở
// nhánh fail-fast của database, chứ không phải chết vì lỗi nạp module.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TIMEOUT_MS = 30_000;

// Dấu hiệu tiến trình đã nạp xong toàn bộ module và chạy tới bước kết nối DB.
const EXPECTED_MARKER = "Kết nối Database thất bại";
// Các lỗi chứng tỏ chết ở tầng nạp module, không phải ở nghiệp vụ.
const MODULE_ERRORS = [
  "ERR_UNSUPPORTED_DIR_IMPORT",
  "ERR_MODULE_NOT_FOUND",
  "Cannot find module",
  "ERR_PACKAGE_IMPORT_NOT_DEFINED",
];

const child = spawn(process.execPath, ["main.js"], {
  cwd: ROOT,
  env: {
    ...process.env,
    NODE_ENV: "test",
    JWT_SECRET: "smoke-test-secret",
    // Cổng không có gì lắng nghe -> connectDB thất bại nhanh và có chủ ý.
    MONGO_URI: "mongodb://127.0.0.1:59999/smoke-test",
    PORT: "5099",
  },
});

let output = "";
child.stdout.on("data", (d) => (output += d));
child.stderr.on("data", (d) => (output += d));

const timer = setTimeout(() => {
  child.kill("SIGKILL");
  console.error("❌ Smoke boot: quá hạn 30s mà tiến trình chưa dừng.");
  process.exit(1);
}, TIMEOUT_MS);

child.on("exit", (code) => {
  clearTimeout(timer);

  const moduleError = MODULE_ERRORS.find((e) => output.includes(e));
  if (moduleError) {
    console.error(`❌ Smoke boot: chết ở tầng NẠP MODULE (${moduleError}).`);
    console.error("   Test có thể vẫn xanh vì Vitest resolve khác Node. Trích log:\n");
    console.error(
      output
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 8)
        .join("\n")
    );
    process.exit(1);
  }

  if (!output.includes(EXPECTED_MARKER)) {
    console.error("❌ Smoke boot: không thấy nhánh fail-fast của database.");
    console.error(`   Exit code ${code}. Trích log:\n`);
    console.error(output.split("\n").slice(0, 15).join("\n"));
    process.exit(1);
  }

  if (output.includes("Server HTTP & Socket đang chạy")) {
    console.error("❌ Smoke boot: server VẪN lắng nghe dù kết nối DB thất bại.");
    process.exit(1);
  }

  console.log("✅ Smoke boot: nạp module thành công, dừng đúng ở fail-fast database.");
  process.exit(0);
});
