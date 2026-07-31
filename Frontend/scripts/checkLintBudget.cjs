// Rào chắn lint cho Frontend (§5.9 của plan tái cấu trúc).
//
// VÌ SAO KHÔNG BẬT THẲNG `npm run lint` LÀM BƯỚC CHẶN MERGE
//
// Repo đang còn 428 lỗi tồn đọng, 361 trong số đó là no-explicit-any — một khoản nợ riêng,
// không dọn xong trong một PR. Bật ngưỡng cứng thì CI đỏ từ ngày đầu, và một CI luôn đỏ sẽ
// bị tắt đi trong vòng một tuần. Đó là cách rào chắn chết.
//
// CI hiện đang để `continue-on-error: true` — tức là chạy lint rồi bỏ qua kết quả. Cái đó
// cũng vô dụng theo hướng ngược lại: không ai đọc log của một bước luôn xanh.
//
// CƠ CHẾ RATCHET, GIỐNG Backend/scripts/checkFileSizes.js
//
//   - Rule đang có lỗi: ghi số hiện tại vào BUDGET. Tăng là ĐỎ. Giảm thì xanh, và script tự
//     nhắc siết baseline xuống.
//   - Rule đang sạch (không có trong BUDGET): xuất hiện một lỗi là ĐỎ ngay.
//
// Điều này chặn được hồi quy THẬT, khác với "để warn". Cụ thể: react-hooks/purity vừa được
// đưa về 0 trong Wave 5 — từ giờ thêm một lỗi purity là CI đỏ, không cần ai canh.
// CẢNH BÁO CHO NGƯỜI SAU — TYPECHECK PHẢI DÙNG `tsc -b`, KHÔNG PHẢI `tsc --noEmit`
//
// tsconfig.json của Frontend là solution file: `"files": []` cộng hai references. Chạy
// `npx tsc --noEmit` với cấu hình đó kiểm ĐÚNG 0 FILE và luôn thoát mã 0 — một lệnh trông
// như đang xác minh nhưng thật ra không xác minh gì.
//
// Tôi đã dính đúng bẫy này trong suốt Wave 5: báo "TSC=0" hàng chục lần trong khi không có
// file nào được kiểm. Nó chỉ lộ ra khi chạy `npm run build` (dùng `tsc -b`) và bật ra hai lỗi
// kiểu thật, trong đó có một lỗi do chính tôi vừa tạo.
//
// Dùng `npm run typecheck` (đã trỏ sẵn vào `tsc -b --force`).
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const FE = path.resolve(__dirname, "..");
const REPORT = path.join(FE, ".eslint-budget-report.json");

// Baseline đo ngày 2026-08-01, sau khi Wave 5 đưa react-hooks từ 47 xuống 13.
// GIẢM ĐƯỢC THÌ CẬP NHẬT XUỐNG. KHÔNG BAO GIỜ tăng lên để cho qua CI — đó là bỏ rào chắn.
const BUDGET = {
  // Khoản nợ lớn nhất, có việc riêng (§5.7). Khoá lại để nó không phình thêm.
  "@typescript-eslint/no-explicit-any": 361,

  // Phần lớn là biến/tham số cục bộ, xoá có thể đổi hành vi nên phải xem tay từng cái.
  "@typescript-eslint/no-unused-vars": 42,

  // Cụm live-session: 6 refs + 3 exhaustive-deps + 2 set-state-in-effect + 1 memo đều nằm
  // trong nhóm hook quấn với socket và Jitsi. Hoãn có chủ đích — xem commit 625d71e.
  "react-hooks/refs": 6,
  "react-hooks/exhaustive-deps": 3,
  "react-hooks/set-state-in-effect": 2,
  "react-hooks/preserve-manual-memoization": 1,
  "react-hooks/immutability": 1,

  "no-useless-assignment": 5,
  "react-refresh/only-export-components": 4,
  "prefer-const": 2,
  "@typescript-eslint/no-empty-object-type": 1,
};

// ESLint thoát mã 1 khi có lỗi — trạng thái bình thường của repo này, không phải sự cố.
// Chỉ cần file báo cáo được ghi ra.
try {
  execSync(`npx eslint . --format json -o "${REPORT}"`, { cwd: FE, stdio: "pipe" });
} catch {
  /* bỏ qua exit code */
}
if (!fs.existsSync(REPORT)) {
  console.error("❌ ESLint không ghi được báo cáo — không thể kiểm ngân sách lint.");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
fs.unlinkSync(REPORT);

const counts = {};
for (const file of report) {
  for (const message of file.messages) {
    const rule = message.ruleId || "(không rõ rule)";
    counts[rule] = (counts[rule] || 0) + 1;
  }
}

const violations = [];
const improvements = [];

// 1. Rule vượt ngân sách, và rule mới xuất hiện
for (const [rule, count] of Object.entries(counts)) {
  const budget = BUDGET[rule];
  if (budget === undefined) {
    violations.push(`  ${rule}: ${count} lỗi MỚI (rule này đang sạch, mọi lỗi đều là hồi quy)`);
  } else if (count > budget) {
    violations.push(`  ${rule}: ${count} > ngân sách ${budget} (tăng ${count - budget})`);
  } else if (count < budget) {
    improvements.push(`  ${rule}: ${count} < ${budget} — siết baseline xuống ${count}`);
  }
}

// 2. Rule đã sạch hẳn nhưng còn nằm trong BUDGET — dọn cho baseline khỏi mục nát
for (const rule of Object.keys(BUDGET)) {
  if (!(rule in counts)) improvements.push(`  ${rule}: đã về 0 — gỡ khỏi BUDGET`);
}

const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
const budgetTotal = Object.values(BUDGET).reduce((sum, n) => sum + n, 0);
console.log(`Lint: ${total} lỗi (ngân sách ${budgetTotal}).`);

if (improvements.length) {
  console.log("\n📉 Đã cải thiện — cập nhật BUDGET trong scripts/checkLintBudget.cjs:");
  console.log(improvements.join("\n"));
}

if (violations.length) {
  console.error("\n❌ Vượt ngân sách lint:");
  console.error(violations.join("\n"));
  console.error(
    "\nSửa lỗi mới thay vì nâng ngân sách. Nâng số trong BUDGET là gỡ bỏ rào chắn,\n" +
      "không phải sửa lỗi."
  );
  process.exit(1);
}

console.log("✅ Không có hồi quy lint.");
