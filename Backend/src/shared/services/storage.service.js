// File: src/shared/services/storage.service.js
//
// Lớp trừu tượng cho tầng lưu trữ file. Toàn bộ code nghiệp vụ chỉ được gọi
// qua đây — không gọi thẳng SDK Cloudinary. Lý do: nếu phải chuyển từ Cloudinary
// sang nhà cung cấp khác (Cloudflare R2, S3...), chỉ cần đổi phần ruột mà không
// chạm vào controller hay middleware.
//
// Cấu trúc kết quả:
//   uploadFile()    → { publicId, format, bytes, resourceType, originalFilename }
//   getSignedUrl()  → string
//   deleteFile()    → boolean

import cloudinary from "#config/cloudinary.js";

/**
 * Upload buffer lên Cloudinary với type 'authenticated' (bắt buộc URL đã ký).
 *
 * @param {Buffer} buffer       - Nội dung file dưới dạng Buffer
 * @param {string} originalName - Tên file gốc (dùng để sinh tên an toàn, lưu vào metadata)
 * @param {Object} options
 * @param {string} options.folder      - Thư mục trên Cloudinary, ví dụ 'eduspace/classes/abc123'
 * @param {string} [options.resourceType='raw'] - 'raw' hoặc 'image'
 * @returns {Promise<{ publicId: string, format: string, bytes: number, resourceType: string, originalFilename: string }>}
 */
export const uploadFile = (buffer, originalName, { folder, resourceType = "raw" } = {}) => {
  return new Promise((resolve, reject) => {
    // Trích xuất đuôi mở rộng từ originalName (ví dụ: .pdf, .docx, .xlsx)
    const ext =
      originalName && typeof originalName === "string" && originalName.includes(".")
        ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase()
        : "";

    // Sinh tên an toàn kèm phần mở rộng file để Cloudinary nhận diện format cho resource_type: 'raw'
    const safeName = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: safeName,
        folder,
        resource_type: resourceType,
        type: "authenticated",
        // Không transform file — giữ nguyên nội dung gốc
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          publicId: result.public_id,
          format: result.format || (ext ? ext.replace(".", "") : null),
          bytes: result.bytes,
          resourceType: result.resource_type,
          originalFilename: originalName,
        });
      }
    );

    stream.end(buffer);
  });
};

export const getSignedUrl = (
  publicId,
  { resourceType = "raw", storageType = "authenticated", format = "", durationSeconds = 7200 } = {}
) => {
  const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;

  let fmt = format || "";
  if (!fmt && publicId && typeof publicId === "string" && publicId.includes(".")) {
    const ext = publicId.substring(publicId.lastIndexOf(".") + 1).toLowerCase();
    if (ext) fmt = ext;
  }

  const signedUrl = cloudinary.utils.private_download_url(publicId, fmt, {
    resource_type: resourceType,
    type: storageType,
    expires_at: expiresAt,
  });

  return {
    signedUrl,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
};

/**
 * Xóa file khỏi Cloudinary.
 *
 * @param {string} publicId
 * @param {Object} options
 * @param {string} [options.resourceType='raw']
 * @param {string} [options.storageType='authenticated']
 * @returns {Promise<boolean>} - true nếu xóa thành công, false nếu thất bại
 */
export const deleteFile = async (
  publicId,
  { resourceType = "raw", storageType = "authenticated" } = {}
) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: storageType,
    });
    return result.result === "ok";
  } catch (err) {
    // Ghi log nhưng không ném lỗi — caller quyết định có chặn flow không.
    console.error("[storageService.deleteFile] Lỗi khi xóa file trên Cloudinary:", {
      publicId,
      resourceType,
      storageType,
      error: err?.message,
    });
    return false;
  }
};

const storageService = { uploadFile, getSignedUrl, deleteFile };
export default storageService;
