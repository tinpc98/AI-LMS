// Logger tối giản, có phân mức, không thêm phụ thuộc.
//
// VÌ SAO KHÔNG DÙNG winston / pino
//
// Giá trị thật mà chúng mang lại — vận chuyển log đi nơi khác, định dạng JSON để truy vấn,
// xoay vòng file — chỉ có ý nghĩa khi đã có nơi thu thập log. Dự án này chưa có. Kéo thêm một
// thư viện cùng cây phụ thuộc của nó để lấy đúng một thứ (lọc theo mức) là không tương xứng.
//
// Khi nào nên đổi: lúc dựng hệ thu thập log tập trung. Giao diện dưới đây (debug/info/warn/
// error) trùng với API của cả winston lẫn pino, nên lúc đó chỉ cần thay phần ruột của file
// này, không phải sửa nơi gọi.
//
// VẤN ĐỀ NÓ GIẢI QUYẾT
//
// Trước đây mọi thứ đều là console.log, nên không có cách nào tắt bớt. Socket handler ghi log
// MỖI LẦN có người kết nối, rời phòng, hay tham gia phòng; route upload ghi tên từng file.
// Trên môi trường thật với vài trăm người dùng, những dòng đó chôn vùi các log thật sự cần
// đọc — và không ai tắt được nếu không sửa mã.
//
// auth.controller đã tự bọc log của nó trong `if (NODE_ENV === "development")`. File này chỉ
// khái quát hoá đúng ý tưởng đó thành một chỗ.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

/**
 * Mức log hiện hành.
 *
 * LOG_LEVEL đặt tường minh thì theo nó. Không đặt thì suy từ NODE_ENV: production chỉ ghi từ
 * info trở lên, test im lặng hoàn toàn (log rác làm nhiễu kết quả test), còn lại ghi tất cả.
 */
const resolveLevel = () => {
  const explicit = (process.env.LOG_LEVEL || "").toLowerCase();
  if (explicit && explicit in LEVELS) return LEVELS[explicit];

  if (process.env.NODE_ENV === "production") return LEVELS.info;
  if (process.env.NODE_ENV === "test") return LEVELS.silent;
  return LEVELS.debug;
};

// Đọc lại mỗi lần ghi thay vì chốt một lần lúc nạp module: test cần đổi LOG_LEVEL giữa chừng,
// và chốt sẵn sẽ khiến biến môi trường đặt sau khi import không có tác dụng — một cái bẫy im
// lặng đúng kiểu đã gặp nhiều lần trong đợt này.
const enabled = (level) => LEVELS[level] >= resolveLevel();

const write = (level, consoleMethod, args) => {
  if (!enabled(level)) return;
  consoleMethod(...args);
};

export const logger = {
  /** Chi tiết vận hành: kết nối socket, từng request, dữ liệu gỡ lỗi. Tắt ở production. */
  debug: (...args) => write("debug", console.log, args),
  /** Sự kiện đáng quan tâm: khởi động, kết quả cron, thay đổi cấu hình. */
  info: (...args) => write("info", console.log, args),
  /** Bất thường nhưng hệ thống vẫn chạy tiếp. */
  warn: (...args) => write("warn", console.warn, args),
  /** Hỏng thật sự. Không bao giờ bị lọc, trừ khi LOG_LEVEL=silent. */
  error: (...args) => write("error", console.error, args),
};

export default logger;
