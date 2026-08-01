/**
 * Codemod TỔNG QUÁT cho Wave 3.2 — đổi import model sang public API của module.
 *
 * Thay cho việc viết một script riêng cho mỗi module (đã làm với auth/class/lesson),
 * script này nhận tên module + bảng ánh xạ model qua tham số dòng lệnh, dùng lại được
 * cho toàn bộ các module còn lại.
 *
 * Xử lý CẢ BA dạng import từng gây lỗi ở các lần migrate trước:
 *   1. static default : import X from "../models/y.model.js"
 *   2. dynamic        : (await import("../models/y.model.js")).default
 *   3. biến thể từ tests/: "../../src/models/y.model.js"
 *
 * File nằm TRONG chính module được bỏ qua — trỏ vào public API của chính mình sẽ tạo
 * vòng tự thân.
 *
 * Dùng:
 *   node scripts/codemods/migrate-module-models.cjs <module> <file.model.js>=<TenExport> [...] [--dry-run]
 * Ví dụ:
 *   node scripts/codemods/migrate-module-models.cjs assignment \
 *        assignment.model.js=Assignment submission.model.js=Submission
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const DRY_RUN = process.argv.includes("--dry-run");
const args = process.argv.slice(2).filter((a) => a !== "--dry-run");

const moduleName = args[0];
if (!moduleName || args.length < 2) {
  console.error("Thiếu tham số. Xem hướng dẫn ở đầu file.");
  process.exit(1);
}

const MODEL_EXPORTS = Object.fromEntries(
  args.slice(1).map((pair) => {
    const [fileName, exportName] = pair.split("=");
    if (!fileName || !exportName) throw new Error(`Tham số sai định dạng: ${pair}`);
    return [fileName, exportName];
  })
);

const MODULE_PATH = `#modules/${moduleName}`;
const MODULE_DIR = `${path.sep}modules${path.sep}${moduleName}${path.sep}`;
const isInsideModule = (file) => file.includes(MODULE_DIR);

const esc = (s) => s.replace(/\./g, "\\.");

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
  ...["src", "tests"].flatMap((d) => collectFiles(path.join(ROOT, d))),
  path.join(ROOT, "main.js"),
].filter(fs.existsSync);

let changedFiles = 0;

for (const file of files) {
  if (isInsideModule(file)) continue;

  const original = fs.readFileSync(file, "utf8");
  let updated = original;

  for (const [fileName, exportName] of Object.entries(MODEL_EXPORTS)) {
    const relPath = `(?:\\.{1,2}/)+(?:src/)?models/${esc(fileName)}`;

    // 1 + 3: import tĩnh dạng default
    updated = updated.replace(
      new RegExp(`import\\s+(\\w+)\\s+from\\s*["']${relPath}["'];?`, "g"),
      (_m, localName) =>
        localName === exportName
          ? `import { ${exportName} } from "${MODULE_PATH}";`
          : `import { ${exportName} as ${localName} } from "${MODULE_PATH}";`
    );

    // 2: dynamic import — bẫy từng khiến 11 test trả 500 ở Wave 3.1
    updated = updated.replace(
      new RegExp(`\\(await import\\(\\s*["']${relPath}["']\\s*\\)\\)\\.default`, "g"),
      `(await import("${MODULE_PATH}")).${exportName}`
    );
  }

  if (updated !== original) {
    changedFiles += 1;
    console.log(`${DRY_RUN ? "[dry]" : "[fix]"} ${path.relative(ROOT, file)}`);
    if (!DRY_RUN) fs.writeFileSync(file, updated);
  }
}

console.log(
  `\n${DRY_RUN ? "Sẽ sửa" : "Đã sửa"} ${changedFiles} file cho module "${moduleName}" (quét ${files.length} file).`
);
