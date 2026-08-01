// File: src/middlewares/requestId.middleware.js
import { randomUUID } from "crypto";

// Gắn 1 mã định danh duy nhất cho mỗi request, phục vụ tra cứu log và trả về
// cho client trong response lỗi (giúp support/debug đối chiếu đúng request).
export const requestId = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
