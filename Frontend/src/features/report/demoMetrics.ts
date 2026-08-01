// Sinh số liệu minh hoạ ỔN ĐỊNH cho module Report.
//
// Module Report hiện 100% chạy bằng dữ liệu mẫu — đã ghi nhận ở docs/reviews/16-mock-data-
// inventory.md, và chính sách trong đó là "nối dữ liệu thật TRƯỚC, gỡ mock SAU" (gỡ trước sẽ
// làm trắng màn hình). File này không sửa được gốc, nó sửa một lỗi khác nghiêm trọng hơn:
//
// Ba chỗ đang gọi Math.random() NGAY TRONG LÚC RENDER (AttendanceReport dòng 32-33,
// StudentReport dòng 52). Nghĩa là mỗi lần React vẽ lại — cuộn bảng, đổi tab, gõ vào ô lọc —
// mọi con số lại nhảy sang giá trị khác. Người dùng nhìn hai lần thấy hai kết quả.
//
// Số bịa mà ổn định thì còn nhận ra được là bịa. Số bịa mà nhảy loạn thì trông như hệ thống
// hỏng, và nó phá luôn mọi so sánh giữa các lần xem.
//
// Cách làm: băm khoá đầu vào thành một số cố định. Cùng một lớp/học sinh luôn ra cùng một
// con số, qua mọi lần render và mọi lần tải lại trang.

/** Băm chuỗi thành số nguyên không âm. Thuật toán djb2 — đủ dùng cho số minh hoạ. */
const hashString = (input: string): number => {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
};

/**
 * Số nguyên ổn định trong khoảng [min, max], suy ra từ `seed`.
 *
 * `salt` để cùng một seed cho ra các số khác nhau ở các chỉ số khác nhau — nếu không, tỉ lệ
 * điểm danh và tỉ lệ đúng giờ của một lớp sẽ luôn bằng nhau, nhìn là biết ngay số giả.
 */
export const stableMetric = (seed: string, salt: string, min: number, max: number): number => {
  const range = max - min + 1;
  return min + (hashString(`${seed}::${salt}`) % range);
};
