/**
 * Codemod cho Wave 3.2 — migrate module auth.
 *
 * Việc khó nhất ở đây KHÔNG phải đổi đường dẫn, mà là TÁCH một import thành nhiều:
 * shared/middlewares/auth.middleware.js trước đây export 5 symbol thuộc 3 mối quan tâm
 * khác nhau, nay nằm ở 3 file. Một dòng
 *     import { verifyUser, isTeacher, checkClassTeacherOwnership } from "...auth.middleware.js"
 * phải trở thành 3 dòng import từ 3 nguồn.
 *
 * Chạy:  node scripts/codemods/migrate-auth-module.cjs [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TARGET_DIRS = ["src", "tests"];
const TARGET_FILES = ["main.js"];
const DRY_RUN = process.argv.includes("--dry-run");

// Symbol nào giờ nằm ở đâu.
const SYMBOL_HOME = {
  verifyUser: "#modules/auth",
  isTeacher: "#shared/middlewares/rbac.middleware.js",
  isAdmin: "#shared/middlewares/rbac.middleware.js",
  checkClassTeacherOwnership: "#shared/middlewares/ownership.middleware.js",
  canViewSubmission: "#shared/middlewares/ownership.middleware.js",
};

// Bắt cả import một dòng lẫn nhiều dòng (Prettier đã xuống dòng ở nhiều file).
const AUTH_IMPORT =
  /import\s*\{([^}]*)\}\s*from\s*["']#shared\/middlewares\/auth\.middleware\.js["'];?/g;

// user.model.js chuyển vào module auth -> ngoài module phải đi qua public API.
const USER_MODEL_IMPORT =
  /import\s+(\w+)\s+from\s*["'](?:\.{1,2}\/)+(?:src\/)?models\/user\.model\.js["'];?/g;

// Bên TRONG module auth, verifyUser phải import theo đường dẫn nội bộ. Nếu trỏ vào
// public API "#modules/auth" thì tạo vòng tự thân (index.js -> auth.routes.js -> index.js)
// — rule no-circular ở mức error đã bắt được đúng lỗi này khi chạy lần đầu.
const isInsideAuthModule = (file) => file.includes(`${path.sep}modules${path.sep}auth${path.sep}`);

const homeFor = (symbol, file) => {
  const home = SYMBOL_HOME[symbol];
  if (home === "#modules/auth" && isInsideAuthModule(file)) return "./auth.middleware.js";
  return home;
};

const splitAuthImport = (content, file) =>
  content.replace(AUTH_IMPORT, (_match, specifierList) => {
    const symbols = specifierList
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const bySource = new Map();
    for (const entry of symbols) {
      // Hỗ trợ cả dạng đổi tên: `verifyUser as requireAuth`.
      const originalName = entry.split(/\s+as\s+/)[0].trim();
      const source = homeFor(originalName, file);
      if (!source) throw new Error(`Symbol chưa khai báo nơi ở mới: ${entry}`);
      if (!bySource.has(source)) bySource.set(source, []);
      bySource.get(source).push(entry); // giữ nguyên cả phần "as ..."
    }

    return [...bySource.entries()]
      .map(([source, syms]) => `import { ${syms.join(", ")} } from "${source}";`)
      .join("\n");
  });

// `import User from "../models/user.model.js"` -> `import { User } from "#modules/auth"`
const rewriteUserModel = (content, file) => {
  // Chính module auth dùng đường dẫn nội bộ, không đổi.
  if (file.includes(`${path.sep}modules${path.sep}auth${path.sep}`)) return content;
  return content.replace(USER_MODEL_IMPORT, (_m, localName) =>
    localName === "User"
      ? `import { User } from "#modules/auth";`
      : `import { User as ${localName} } from "#modules/auth";`
  );
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
  const original = fs.readFileSync(file, "utf8");
  let updated = splitAuthImport(original, file);
  updated = rewriteUserModel(updated, file);

  if (updated !== original) {
    changedFiles += 1;
    console.log(`${DRY_RUN ? "[dry]" : "[fix]"} ${path.relative(ROOT, file)}`);
    if (!DRY_RUN) fs.writeFileSync(file, updated);
  }
}

console.log(`\n${DRY_RUN ? "Sẽ sửa" : "Đã sửa"} ${changedFiles} file (quét ${files.length} file).`);
