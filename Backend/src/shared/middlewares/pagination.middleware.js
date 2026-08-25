import { ValidationError } from "#shared/utils/appError.js";

/**
 * Middleware chuẩn hóa và xác thực các tham số phân trang.
 * Sẽ ném ValidationError nếu page hoặc limit không hợp lệ.
 * Nếu không truyền, mặc định page = 1, limit = 10 (tối đa 100).
 */
export const validatePagination = (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) {
      throw new ValidationError("Tham số 'page' phải là số nguyên dương lớn hơn 0.");
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new ValidationError("Tham số 'limit' phải là số nguyên dương từ 1 đến 100.");
    }

    req.query.page = page;
    req.query.limit = limit;
    
    next();
  } catch (error) {
    next(error);
  }
};
