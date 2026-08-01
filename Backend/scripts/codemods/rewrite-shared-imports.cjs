/**
 * Codemod: đổi import tương đối sang alias sau khi chuyển hạ tầng dùng chung
 * vào src/shared/ và src/infra/ (Wave 3.1).
 *
 * Vì sao dùng alias thay vì đường dẫn tương đối mới: sau này khi file nghiệp vụ
 * chuyển vào src/modules/<tên>/ ở độ sâu khác, các import này KHÔNG cần sửa lại
 * lần nữa. Đó chính là lý do §4.3 của kế hoạch yêu cầu có alias trước khi di chuyển.
 *
 * Mẫu regex chấp nhận mọi tiền tố tương đối và cả biến thể "../../src/..." mà
 * thư mục tests/ đang dùng.
 *
 * Chạy:  node scripts/codemods/rewrite-shared-imports.cjs [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TARGET_DIRS = ["src", "tests"];
const TARGET_FILES = ["main.js"];
const DRY_RUN = process.argv.includes("--dry-run");

// (?:\.{1,2}/)+  khớp "./", "../", "../../" ...
// (?:src/)?      khớp thêm biến thể từ tests/: "../../src/utils/appError.js"
const rel = (suffix) => new RegExp(`(?:\\.{1,2}/)+(?:src/)?${suffix}`, "g");

const REPLACEMENTS = [
  [rel("utils/appError\\.js"), "#shared/utils/appError.js"],
  [rel("utils/response\\.js"), "#shared/utils/response.js"],
  [rel("plugins/softDelete\\.plugin\\.js"), "#shared/plugins/softDelete.plugin.js"],
  [
    rel("middlewares/(auth|errorHandler|requestId|rateLimit|upload)\\.middleware\\.js"),
    "#shared/middlewares/$1.middleware.js",
  ],
  [rel("middlewares/socketAuth\\.middleware\\.js"), "#infra/socket/socketAuth.middleware.js"],
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
