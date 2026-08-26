import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { AppError } from "#shared/utils/appError.js";

// BR mục 1.3: tài liệu PDF/DOCX/PPTX/XLSX/ảnh, ≤50MB — cùng cơ chế kiểm magic-bytes chống giả
// mạo MIME type đã dùng cho chatUpload.middleware.js (không dùng lại trực tiếp vì giới hạn
// dung lượng và danh sách định dạng cho phép khác nhau — tài liệu bài giảng không cho zip).
const FIFTY_MB = 50 * 1024 * 1024;

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
]);

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
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_CLIENT_MIMES.has(file.mimetype)) {
    return cb(
      new AppError(
        "Loại file không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, PPTX, XLSX và ảnh.",
        "INVALID_FILE_TYPE",
        400
      ),
      false
    );
  }
  cb(null, true);
};

export const lessonUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: FIFTY_MB, files: 1 },
});

export const validateLessonDocumentMagicBytes = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "Chưa có file được tải lên." });
  }

  try {
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !ALLOWED_MAGIC_MIMES.has(detected.mime)) {
      return res.status(400).json({
        message: `Loại file thực tế không được hỗ trợ${detected ? ` (phát hiện: ${detected.ext})` : ""}.`,
      });
    }
    req.file.detectedMime = detected.mime;
    req.file.detectedExt = detected.ext;
    next();
  } catch {
    return res
      .status(400)
      .json({ message: "Không thể xác định loại file. Vui lòng thử lại với file hợp lệ." });
  }
};
