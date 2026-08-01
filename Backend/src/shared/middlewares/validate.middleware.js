// File: src/shared/middlewares/validate.middleware.js
// Runner của express-validator: gom lỗi validate thành phản hồi 400 chuẩn hoá.
//
// Tách từ src/utils/validators.js ở Wave 3.2. File đó là god file 926 dòng trộn bốn
// nhóm nghiệp vụ khác nhau; đây là phần DUY NHẤT trong đó thật sự dùng chung, nên nó
// về shared/ còn phần còn lại về module tương ứng.
import { validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không hợp lệ, vui lòng kiểm tra lại.",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};
