/**
 * Codemod: cập nhật đường dẫn import sau khi chuẩn hoá tên file theo §4.1
 * của kế hoạch refactor (Wave 2.2 / 2.3).
 *
 *   *.services.js   -> *.service.js      (số ít cho file, số nhiều cho thư mục)
 *   user.models.js  -> user.model.js
 *   *.middlewares.js-> *.middleware.js
 *   src/routers/    -> src/routes/
 *
 * Vì sao thay chuỗi chứ không dùng AST: mọi mẫu dưới đây đều kết thúc bằng ".js"
 * hoặc là một đoạn đường dẫn có dấu "/", nên chỉ khớp bên trong chuỗi đường dẫn
 * import/export — không có nguy cơ đụng vào tên định danh trong mã.
 *
 * Chạy:  node scripts/codemods/rename-module-imports.cjs [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TARGET_DIRS = ["src", "tests"];
const TARGET_FILES = ["main.js"];
const DRY_RUN = process.argv.includes("--dry-run");

// Thứ tự quan trọng: mẫu cụ thể đặt trước mẫu tổng quát.
const REPLACEMENTS = [
  [/auth\.services\.js/g, "auth.service.js"],
  [/examSet\.services\.js/g, "examSet.service.js"],
  [/folder\.services\.js/g, "folder.service.js"],
  [/user\.models\.js/g, "user.model.js"],
  // Chỉ đổi hậu tố FILE. Thư mục "middlewares/" giữ nguyên số nhiều nên mẫu
  // ".middlewares.js" không bao giờ khớp vào tên thư mục.
  [/\.middlewares\.js/g, ".middleware.js"],
  [/([./])routers\//g, "$1routes/"],
];

const collectFiles = (dir, acc = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, acc);
    else if (/\.(js|cjs|mjs)$/.test(entry.name)) acc.push(full);
  }
  return acc;
};

const files = [
  ...TARGET_DIRS.flatMap((d) => collectFiles(path.join(ROOT, d))),
  ...TARGET_FILES.map((f) => path.join(ROOT, f)).filter(fs.existsSync),
];

let changedFiles = 0;
let totalHits = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  let updated = original;
  let hits = 0;

  for (const [pattern, replacement] of REPLACEMENTS) {
    const matches = updated.match(pattern);
    if (matches) {
      hits += matches.length;
      updated = updated.replace(pattern, replacement);
    }
  }

  if (hits > 0) {
    changedFiles += 1;
    totalHits += hits;
    console.log(`${DRY_RUN ? "[dry]" : "[fix]"} ${path.relative(ROOT, file)} (${hits})`);
    if (!DRY_RUN) fs.writeFileSync(file, updated);
  }
}

console.log(
  `\n${DRY_RUN ? "Sẽ sửa" : "Đã sửa"} ${totalHits} tham chiếu trong ${changedFiles} file (quét ${files.length} file).`
);
