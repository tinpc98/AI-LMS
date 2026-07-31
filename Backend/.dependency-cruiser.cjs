/**
 * Rào chắn kiến trúc Backend — dependency-cruiser.
 *
 * Giai đoạn hiện tại (Wave 0): TOÀN BỘ rule để "warn" nhằm chụp lại baseline vi phạm
 * mà không chặn CI. Cấu trúc đích `src/modules/` chưa tồn tại nên các rule dưới đây
 * được viết theo cấu trúc HIỆN TẠI (controllers/ services/ repositories/ models/).
 *
 * Khi Wave 3 dựng xong `src/modules/`, thay path trong rule và nâng severity lên "error"
 * theo kế hoạch §5.2 + §Wave 2.6 / 3.6.
 */
module.exports = {
  forbidden: [
    {
      // RATCHET: baseline đo ngày 2026-07-31 là 0 vi phạm, nên khoá thẳng ở "error"
      // để không ai vô tình tạo vòng phụ thuộc mới. Đây là rule DUY NHẤT chặn CI ở Wave 0.
      name: "no-circular",
      comment:
        "Phụ thuộc vòng tròn khiến thứ tự khởi tạo module không xác định và chặn việc tách module về sau.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-controller-to-model",
      comment:
        "Controller chỉ được nói chuyện với Service. Truy cập thẳng Model là vi phạm Dependency Rule (§0.3).",
      severity: "warn",
      from: { path: "^src/controllers/.+\\.controller\\.js$" },
      to: { path: "^src/models/" },
    },
    {
      name: "no-model-to-upper-layer",
      comment: "Model là tầng thấp nhất, không được biết gì về service/controller/router.",
      severity: "warn",
      from: { path: "^src/models/" },
      to: { path: "^src/(controllers|services|routers)/" },
    },
    {
      name: "no-utils-to-business",
      comment:
        "src/utils phải thuần tuý, không phụ thuộc nghiệp vụ — nếu không sẽ không tách sang shared/ được (§2.1).",
      severity: "warn",
      from: { path: "^src/utils/" },
      to: { path: "^src/(controllers|services|repositories|routers)/" },
    },
    {
      // Wave 3: src/shared là tầng dùng chung, không được biết gì về nghiệp vụ cụ thể.
      // Hiện chưa có vi phạm vì src/modules/ còn rỗng, NHƯNG sẽ có ngay khi user.model.js
      // chuyển vào modules/auth/ — shared/middlewares/auth.middleware.js đang import nó.
      // Đó là nợ kiến trúc cần giải quyết khi migrate module auth (tách phần đọc User ra
      // khỏi middleware, hoặc đưa auth.middleware về chính module auth).
      name: "no-shared-to-modules",
      comment: "src/shared không được phụ thuộc vào module nghiệp vụ.",
      severity: "warn",
      from: { path: "^src/shared/" },
      to: { path: "^src/modules/" },
    },
    {
      name: "no-orphans",
      comment: "File không được ai import — thường là code chết còn sót lại.",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: ["\\.(json|md)$", "^src/scripts/", "^src/seed\\.js$", "^(\\.[^/]+)$"],
      },
      to: {},
    },
    {
      name: "not-to-dev-dep",
      comment: "Code production không được import devDependency.",
      severity: "warn",
      from: { path: "^src/", pathNot: "\\.test\\.js$" },
      to: { dependencyTypes: ["npm-dev"] },
    },
  ],

  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(node_modules|tests/|scripts/)" },
    tsPreCompilationDeps: false,
    combinedDependencies: false,
    reporterOptions: {
      archi: {
        collapsePattern: "^src/[^/]+",
      },
    },
  },
};
