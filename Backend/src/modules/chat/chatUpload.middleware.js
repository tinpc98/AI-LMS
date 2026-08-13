import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { AppError } from "#shared/utils/appError.js";

const TWENTY_FIVE_MB = 25 * 1024 * 1024;
const TEN_MB = 10 * 1024 * 1024;

const ALLOWED_CLIENT_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_MAGIC_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_CLIENT_MIMES.has(file.mimetype)) {
    return cb(
      new AppError("Loại file không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, PPTX, XLSX, ZIP và ảnh.", "INVALID_FILE_TYPE", 400),
      false
    );
  }
  cb(null, true);
};

export const chatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: TWENTY_FIVE_MB, // Mức tối đa chung là 25MB, giới hạn 10MB cho ảnh sẽ kiểm tra sau
    files: 1,
  },
});

export const validateChatMagicBytes = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      code: "FILE_REQUIRED",
      message: "Chưa có file được tải lên.",
    });
  }

  try {
    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected || !ALLOWED_MAGIC_MIMES.has(detected.mime)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_MAGIC_BYTES",
        message: `Loại file thực tế không được hỗ trợ${detected ? ` (phát hiện: ${detected.ext})` : ""}.`,
      });
    }

    // Kiểm tra giới hạn 10MB cho ảnh
    if (detected.mime.startsWith("image/") && req.file.size > TEN_MB) {
      return res.status(400).json({
        success: false,
        code: "FILE_TOO_LARGE",
        message: "Ảnh tải lên không được vượt quá 10MB.",
      });
    }

    req.file.detectedMime = detected.mime;
    req.file.detectedExt = detected.ext;
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      code: "FILE_TYPE_ERROR",
      message: "Không thể xác định loại file. Vui lòng thử lại với file hợp lệ.",
    });
  }
};
