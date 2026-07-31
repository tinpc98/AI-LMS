// Rào chắn: số lời gọi console.* trong mã ứng dụng không được tăng.
//
// VÌ SAO KHÔNG ĐẶT NGƯỠNG 0
//
// Còn 128 lời gọi console trong src/ (không tính các thư mục miễn trừ bên dưới). Phần lớn là console.error ở các nhánh bắt lỗi — chuyển
// hết sang logger là một đợt sửa diện rộng, mà lợi ích thật chỉ xuất hiện khi có hệ thu thập
// log tập trung (dự án chưa có). Đặt ngưỡng 0 hôm nay sẽ làm CI đỏ và rồi bị tắt.
//
// Nên khoá ở con số hiện tại: mã mới phải dùng logger, mã cũ dọn dần.
//
// NHỮNG THƯ MỤC ĐƯỢC MIỄN
//
//   src/scripts/     công cụ chạy tay từ dòng lệnh — console CHÍNH LÀ giao diện của chúng
//   src/seed.js      như trên
//   migrations/      như trên, và cần in báo cáo kể cả khi LOG_LEVEL bị hạ
//   logger.js        bản thân nó phải gọi console
//
// Ở những chỗ đó, lọc log theo mức là sai: người dùng gõ lệnh và muốn thấy kết quả.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

// Baseline đo ngày 2026-08-01. GIẢM ĐƯỢC THÌ CẬP NHẬT XUỐNG.
// KHÔNG BAO GIỜ tăng lên để cho qua CI — đó là gỡ bỏ rào chắn, không phải sửa lỗi.
const BASELINE = 128;

const MIEN_TRU = [
  "src/scripts/",
  "src/seed.js",
  "src/infra/db/migrations/",
  "src/shared/utils/logger.js",
];

const toPosix = (p) => path.relative(ROOT, p).split(path.sep).join("/");

const duocMienTru = (relPath) => MIEN_TRU.some((prefix) => relPath.startsWith(prefix));

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
};

const CONSOLE_RE = /\bconsole\.(log|warn|error|info|debug|trace)\s*\(/g;

const perFile = [];
let total = 0;

for (const file of walk(SRC)) {
  const rel = toPosix(file);
  if (duocMienTru(rel)) continue;

  const matches = fs.readFileSync(file, "utf8").match(CONSOLE_RE);
  if (!matches) continue;

  total += matches.length;
  perFile.push({ rel, count: matches.length });
}

console.log(`console.* trong mã ứng dụng: ${total} (ngân sách ${BASELINE}).`);

if (total > BASELINE) {
  perFile.sort((a, b) => b.count - a.count);
  console.error(`\n❌ Số lời gọi console tăng thêm ${total - BASELINE}.`);
  console.error("   Dùng logger từ #shared/utils/logger.js thay vì console:");
  console.error("     logger.debug  chi tiết vận hành, tắt ở production");
  console.error("     logger.info   sự kiện đáng quan tâm");
  console.error("     logger.warn / logger.error");
  console.error("\n   Các file nhiều console nhất hiện nay:");
  for (const { rel, count } of perFile.slice(0, 8)) {
    console.error(`     ${String(count).padStart(3)}  ${rel}`);
  }
  process.exit(1);
}

if (total < BASELINE) {
  console.log(
    `📉 Giảm ${BASELINE - total}. Cập nhật BASELINE trong scripts/checkConsoleUsage.cjs xuống ${total}.`
  );
}

console.log("✅ Không có hồi quy console.");
