/**
 * Codemod cho Wave 3.2 — migrate module class.
 *
 * Rút kinh nghiệm từ module auth: hàm homeFor() phải trả về đường dẫn NỘI BỘ khi file
 * đang sửa nằm trong chính module đó, nếu không sẽ tạo vòng tự thân
 * (index.js -> class.routes.js -> index.js) mà toàn bộ test vẫn pass, chỉ depcruise bắt.
 *
 * Chạy:  node scripts/codemods/migrate-class-module.cjs [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TARGET_DIRS = ["src", "tests"];
const TARGET_FILES = ["main.js"];
const DRY_RUN = process.argv.includes("--dry-run");

const MODULE_DIR = `${path.sep}modules${path.sep}class${path.sep}`;
const isInsideModule = (file) => file.includes(MODULE_DIR);

// import mặc định model Class: `import classModel from "../models/class.model.js"`
const CLASS_MODEL_IMPORT =
  /import\s+(\w+)\s+from\s*["'](?:\.{1,2}\/)+(?:src\/)?models\/class\.model\.js["'];?/g;

// import checkClassTeacherOwnership từ vị trí cũ ở shared/
const OWNERSHIP_IMPORT =
  /import\s*\{([^}]*)\}\s*from\s*["']#shared\/middlewares\/ownership\.middleware\.js["'];?/g;

const SYMBOL_HOME = {
  checkClassTeacherOwnership: "#modules/class",
  canViewSubmission: "../middlewares/submissionAccess.middleware.js",
};

const rewriteClassModel = (content, file) => {
  if (isInsideModule(file)) return content;
  return content.replace(CLASS_MODEL_IMPORT, (_m, localName) =>
    localName === "Class"
      ? `import { Class } from "#modules/class";`
      : `import { Class as ${localName} } from "#modules/class";`
  );
};

const rewriteOwnership = (content, file) =>
  content.replace(OWNERSHIP_IMPORT, (_match, specifierList) => {
    const symbols = specifierList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const bySource = new Map();
    for (const entry of symbols) {
      const originalName = entry.split(/\s+as\s+/)[0].trim();
      let source = SYMBOL_HOME[originalName];
      if (!source) throw new Error(`Symbol chưa khai báo nơi ở mới: ${entry}`);
      // Trong chính module class thì dùng đường dẫn nội bộ, tránh vòng tự thân.
      if (source === "#modules/class" && isInsideModule(file)) source = "./class.ownership.js";
      if (!bySource.has(source)) bySource.set(source, []);
      bySource.get(source).push(entry);
    }

    return [...bySource.entries()]
      .map(([source, syms]) => `import { ${syms.join(", ")} } from "${source}";`)
      .join("\n");
  });

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
  const original = fs.readFileSync(file, "utf8");
  let updated = rewriteClassModel(original, file);
  updated = rewriteOwnership(updated, file);

  if (updated !== original) {
    changedFiles += 1;
    console.log(`${DRY_RUN ? "[dry]" : "[fix]"} ${path.relative(ROOT, file)}`);
    if (!DRY_RUN) fs.writeFileSync(file, updated);
  }
}

console.log(`\n${DRY_RUN ? "Sẽ sửa" : "Đã sửa"} ${changedFiles} file (quét ${files.length} file).`);
