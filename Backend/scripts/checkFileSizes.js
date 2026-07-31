// File: scripts/checkFileSizes.js
// Rào chắn kích thước file — thay cho rule ESLint `max-lines` mà §5.3 đề xuất.
//
// VÌ SAO KHÔNG DÙNG ESLINT: Backend hiện KHÔNG có ESLint (chỉ Frontend có). Kéo cả một
// toolchain lint vào chỉ để lấy một rule là không tương xứng, và sẽ lôi theo hàng trăm
// cảnh báo tồn đọng không liên quan. Script này làm đúng một việc, chạy trong 200ms.
//
// CƠ CHẾ RATCHET, KHÔNG PHẢI NGƯỠNG CỨNG:
// Bật thẳng trần 400/250 sẽ làm CI đỏ ngay vì đang có file 758 dòng. Ngưỡng đỏ mà không ai
// sửa được thì sẽ bị tắt đi — rào chắn chết. Thay vào đó:
//
//   - File ĐANG vượt trần: ghi vào baseline dưới đây kèm số dòng hiện tại. CI chỉ đỏ khi
//     file đó PHÌNH THÊM. Thu nhỏ thì luôn được, và nên cập nhật lại baseline cho chặt hơn.
//   - File CHƯA vượt trần: vượt là đỏ ngay.
//
// Cùng chiến lược đã dùng cho no-circular ở Wave 0: đo baseline, khoá không cho tệ thêm,
// rồi cải thiện dần. Khác với "để warn" ở chỗ nó THẬT SỰ chặn hồi quy.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

const LIMIT_DEFAULT = 400;
const LIMIT_CONTROLLER = 250;

// Baseline đo ngày 2026-07-31. Số là dòng CÓ NGHĨA (đã trừ comment và dòng trống).
// Giảm được thì cập nhật xuống; KHÔNG BAO GIỜ tăng lên để cho qua CI — đó là bỏ rào chắn.
const BASELINE = {
  // Nhóm exam-set — vẫn còn to sau khi chẻ god service ở §4.1. examSetQuestion gánh 4 hàm
  // CRUD câu hỏi cộng 12 helper kiểm tra payload theo từng loại câu hỏi; chẻ tiếp nên tách
  // phần validate ra khỏi phần thao tác dữ liệu.
  "modules/exam-set/examSetQuestion.service.js": 588,
  "modules/exam-set/examSet.controller.js": 388,
  "modules/exam-set/examSetShare.service.js": 532,
  "modules/exam-set/examSet.service.js": 425,

  // Controller còn to vì chưa rút hết logic xuống service (§4.3 mới làm cho class).
  "modules/class/class.controller.js": 462,
  "modules/exam-attempt/examAttempt.controller.js": 408,
  "modules/exam/exam.controller.js": 363,
  "modules/auth/auth.controller.js": 290,

  // Validate câu hỏi trắc nghiệm: 12 helper theo 4 loại câu hỏi, vốn nằm trong god file
  // validators.js 926 dòng trước Wave 3.
  "modules/question/question.validator.js": 410,
};

/** Đếm dòng có nghĩa: bỏ dòng trống và dòng chỉ chứa comment. */
const countMeaningfulLines = (content) =>
  content.split("\n").filter((line) => {
    const t = line.trim();
    if (!t) return false;
    return !(t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"));
  }).length;

const collect = (dir, acc = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "scripts") continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(p, acc);
    else if (entry.name.endsWith(".js")) acc.push(p);
  }
  return acc;
};

const limitFor = (rel) => (rel.endsWith(".controller.js") ? LIMIT_CONTROLLER : LIMIT_DEFAULT);

const newViolations = [];
const grown = [];
const shrunk = [];

for (const file of collect(SRC)) {
  const rel = path.relative(SRC, file).replace(/\\/g, "/");
  const lines = countMeaningfulLines(fs.readFileSync(file, "utf8"));
  const limit = limitFor(rel);
  const baseline = BASELINE[rel];

  if (baseline !== undefined) {
    if (lines > baseline) grown.push({ rel, lines, baseline });
    else if (lines < baseline) shrunk.push({ rel, lines, baseline });
    continue;
  }
  if (lines > limit) newViolations.push({ rel, lines, limit });
}

if (shrunk.length) {
  console.log("📉 Đã thu nhỏ so với baseline — cập nhật BASELINE trong file này cho chặt hơn:");
  for (const s of shrunk) console.log(`   ${s.rel}: ${s.baseline} -> ${s.lines}`);
  console.log("");
}

let failed = false;

if (newViolations.length) {
  failed = true;
  console.error("❌ File MỚI vượt trần kích thước:");
  for (const v of newViolations) console.error(`   ${v.rel}: ${v.lines} dòng (trần ${v.limit})`);
  console.error("");
}

if (grown.length) {
  failed = true;
  console.error("❌ File đang vượt trần lại PHÌNH THÊM:");
  for (const g of grown) console.error(`   ${g.rel}: ${g.baseline} -> ${g.lines} dòng`);
  console.error("   Tách bớt trước khi thêm code vào những file này.");
  console.error("");
}

if (failed) process.exit(1);

console.log(
  `✅ Kích thước file đạt yêu cầu (trần ${LIMIT_DEFAULT} chung / ${LIMIT_CONTROLLER} cho controller, ` +
    `${Object.keys(BASELINE).length} file đang trong danh sách ratchet).`
);
