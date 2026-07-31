/**
 * Codemod cho Wave 3.2 — migrate module lesson.
 *
 * Cùng khuôn mẫu với migrate-auth/class-module.cjs: file NGOÀI module đổi sang public API,
 * file TRONG module giữ đường dẫn tương đối (tránh vòng tự thân index.js -> routes -> index.js).
 *
 * Chạy:  node scripts/codemods/migrate-lesson-module.cjs [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TARGET_DIRS = ["src", "tests"];
const TARGET_FILES = ["main.js"];
const DRY_RUN = process.argv.includes("--dry-run");

const MODULE_DIR = `${path.sep}modules${path.sep}lesson${path.sep}`;
const isInsideModule = (file) => file.includes(MODULE_DIR);

// model -> tên export trong public API
const MODEL_EXPORTS = {
  "lesson.model.js": "Lesson",
  "lessonProgress.model.js": "LessonProgress",
};

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

for (const file of files) {
  if (isInsideModule(file)) continue;

  const original = fs.readFileSync(file, "utf8");
  let updated = original;

  for (const [fileName, exportName] of Object.entries(MODEL_EXPORTS)) {
    const pattern = new RegExp(
      `import\\s+(\\w+)\\s+from\\s*["'](?:\\.{1,2}/)+(?:src/)?models/${fileName.replace(".", "\\.")}["'];?`,
      "g"
    );
    updated = updated.replace(pattern, (_m, localName) =>
      localName === exportName
        ? `import { ${exportName} } from "#modules/lesson";`
        : `import { ${exportName} as ${localName} } from "#modules/lesson";`
    );
  }

  if (updated !== original) {
    changedFiles += 1;
    console.log(`${DRY_RUN ? "[dry]" : "[fix]"} ${path.relative(ROOT, file)}`);
    if (!DRY_RUN) fs.writeFileSync(file, updated);
  }
}

console.log(`\n${DRY_RUN ? "Sẽ sửa" : "Đã sửa"} ${changedFiles} file (quét ${files.length} file).`);
