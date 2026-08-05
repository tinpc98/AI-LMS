// File: src/shared/middlewares/resourceUpload.middleware.js
//
// Multer instance dùng cho endpoint upload tài liệu lớp học.
// Khác với upload.middleware.js (dùng cho ảnh/bài giảng):
//   - Giới hạn 50MB/file
//   - Whitelist mở rộng: PDF, DOCX, PPTX, XLSX + ảnh thông dụng
//   - Kiểm tra magic bytes qua thư viện file-type (không tin đuôi file hay MIME từ client)
//
// Lưu ý bảo mật: kiểm tra magic bytes ở middleware RIÊNG sau multer (validateMagicBytes),
// vì multer cần đọc hết buffer trước rồi mới có thể kiểm tra.

import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const FIFTY_MB = 50 * 1024 * 1024;

// MIME types được client khai báo — chỉ dùng để lọc sơ bộ.
// Magic bytes (bên dưới) mới là lớp kiểm tra thật sự.
const ALLOWED_CLIENT_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Magic bytes mapping: MIME thật sau khi kiểm tra → tên hiển thị
const ALLOWED_MAGIC_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Lọc sơ bộ bằng MIME type từ client — không đủ tin cậy nhưng loại nhanh
  // các request sai trước khi đọc hết buffer vào RAM.
  if (!ALLOWED_CLIENT_MIMES.has(file.mimetype)) {
    return cb(
      Object.assign(new Error("Loại file không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, PPTX, XLSX và ảnh thông dụng."), {
        code: "INVALID_FILE_TYPE",
        status: 400,
      }),
      false
    );
  }
  cb(null, true);
};

// Multer instance cho endpoint upload tài liệu
export const resourceUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FIFTY_MB,
    files: 1, // Chỉ 1 file mỗi request
  },
});

/**
 * Middleware kiểm tra magic bytes sau khi multer đã đọc xong buffer.
 * Phải đặt SAU resourceUpload.single('file') trong middleware chain.
 *
 * Đây là tầng bảo mật thật sự — đổi tên `virus.exe` thành `baigiang.pdf`
 * không qua được lớp này.
 */
export const validateMagicBytes = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Chưa có file được tải lên. Vui lòng chọn file.",
    });
  }

  try {
    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected || !ALLOWED_MAGIC_MIMES.has(detected.mime)) {
      return res.status(400).json({
        success: false,
        message: `Loại file thực tế không được hỗ trợ${detected ? ` (phát hiện: ${detected.ext})` : ""}. Chỉ chấp nhận PDF, DOCX, PPTX, XLSX và ảnh thông dụng.`,
      });
    }

    // Gắn MIME thật vào req.file để các middleware sau dùng
    req.file.detectedMime = detected.mime;
    req.file.detectedExt = detected.ext;
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Không thể xác định loại file. Vui lòng thử lại với file hợp lệ.",
    });
  }
};

// Giới hạn quota mỗi lớp: 2 GB
export const CLASS_STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024;
// Ngưỡng cảnh báo: 80%
export const QUOTA_WARNING_THRESHOLD = 0.8;
