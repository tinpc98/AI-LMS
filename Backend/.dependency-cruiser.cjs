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
      comment:
        "Model là tầng thấp nhất, không được biết gì về service/controller/router.",
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
      name: "no-orphans",
      comment: "File không được ai import — thường là code chết còn sót lại.",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "\\.(json|md)$",
          "^src/scripts/",
          "^src/seed\\.js$",
          "^(\\.[^/]+)$",
        ],
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
