/**
 * Rào chắn kiến trúc Backend — dependency-cruiser.
 *
 * Cập nhật ở Wave 3.6, sau khi toàn bộ 17 module nghiệp vụ đã chuyển vào src/modules/.
 *
 * Bố cục các tầng và chiều phụ thuộc được phép:
 *
 *     routes/index.js  +  infra/socket/registerHandlers.js     (composition root)
 *            │  được phép trỏ thẳng vào *.routes.js / *.socket.js của module
 *            ▼
 *     reporting/  ──đọc──>  modules/  ──>  shared/  ──>  (npm)
 *                              │             ▲
 *                              └─────────────┘  chỉ một chiều
 *
 * Rule ở mức "error" CHẶN MERGE. Rule ở mức "warn" là nợ kỹ thuật đã biết, có kế hoạch
 * xử lý ở Wave 4 — mỗi rule ghi rõ ngay tại chỗ.
 *
 * LƯU Ý khi thêm rule mới: phải kiểm tra rule có thật sự "nhìn thấy" vi phạm sau khi
 * cấu trúc đổi hay không. Đã hai lần rule tự mù trong dự án này (tên file .controllers.js
 * không khớp mẫu; và rule chỉ khai bố cục src/controllers cũ). Số cảnh báo giảm KHÔNG
 * đồng nghĩa với đã sửa.
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
      // Phải phủ CẢ hai bố cục trong lúc migrate: cấu trúc cũ (src/controllers ->
      // src/models) và cấu trúc module mới (modules/X/*.controller.js -> *.model.js).
      // Nếu chỉ khai báo bố cục cũ, rule sẽ âm thầm mù với mọi module đã chuyển —
      // đúng kiểu lỗi mà tên file .controllers.js đã gây ra ở Wave 2.
      from: { path: "\\.controller\\.js$" },
      to: { path: "\\.model\\.js$" },
      // HẠN CHẾ ĐÃ BIẾT: rule không xuyên qua re-export của index.js. Khi controller lấy
      // model của module KHÁC qua public API (vd class.controller import { User } từ
      // #modules/auth), depcruise thấy đích là index.js chứ không phải *.model.js nên
      // không báo. Số vi phạm vì thế sẽ giảm dần theo tiến độ migrate mà không phải do
      // đã sửa. Đừng dùng con số này làm thước đo khối lượng Wave 4.3.
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
      // §5.2 — module chỉ được import PUBLIC API (index.js) của module khác, không thọc
      // vào file nội bộ. Để "warn" trong lúc migrate, nâng lên "error" ở Wave 3.6 khi
      // toàn bộ module đã chuyển xong.
      // WAVE 3.6: nâng lên "error". Baseline sau khi migrate xong 17 module là 0 vi phạm,
      // nên khoá lại để ranh giới module không bị xói mòn dần.
      name: "no-cross-module-internals",
      comment: "Module khác chỉ được import qua index.js của module, không vào file nội bộ.",
      severity: "error",
      // Hai composition root được miễn trừ vì phải trỏ thẳng vào file nội bộ module:
      //   src/routes/index.js            -> *.routes.js
      //   src/infra/socket/registerHandlers.js -> *.socket.js
      // Lý do đầy đủ ghi trong chính hai file đó.
      from: {
        path: "^src/modules/([^/]+)/",
        pathNot: "^src/(routes/index|infra/socket/registerHandlers)\\.js$",
      },
      to: {
        path: "^src/modules/([^/]+)/(?!index\\.js$).+",
        pathNot: "^src/modules/$1/",
      },
    },
    {
      // WAVE 3.6 — chiều CẤM quan trọng nhất của tầng reporting. Nếu một module nghiệp vụ
      // import từ reporting/, nghĩa là logic báo cáo đã rò ngược vào nghiệp vụ và ta mất
      // khả năng tách module đó ra. Baseline 0 vi phạm nên khoá thẳng ở "error".
      // Lý do đầy đủ: src/reporting/README.md.
      name: "no-modules-to-reporting",
      comment: "Module nghiệp vụ không được phụ thuộc vào tầng đọc tổng hợp reporting/.",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: "^src/reporting/" },
    },
    {
      // shared/ là tầng thấp nhất — không được biết gì về reporting/ lẫn jobs/.
      name: "no-shared-to-upper-tiers",
      comment: "src/shared không được phụ thuộc vào reporting/ hay jobs/.",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(reporting|jobs)/" },
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
