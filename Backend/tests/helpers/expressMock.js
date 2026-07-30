// Helper dùng chung để chạy chuỗi middleware express-validator ngoài HTTP thật,
// port từ helper trùng lặp trong src/scripts/runMultipleChoiceValidatorTests.js
// và src/scripts/runEssayQuestionValidationTests.js.

export const createRequest = (body) => ({ body, params: {}, query: {} });

export const createResponse = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

/**
 * Chạy tuần tự 1 mảng middleware (dạng express-validator chain) trên req/res giả lập.
 * Trả về true nếu toàn bộ middleware gọi next() không lỗi (tức là request hợp lệ),
 * false nếu middleware nào đó set response (res.statusCode) trước khi tới next.
 *
 * Middleware kiểu error-handler (vd. handleValidationErrors) cố tình KHÔNG gọi next()
 * khi từ chối request — nó gửi response rồi dừng, đúng như hành vi Express thật (Express
 * không cần next() được gọi nếu response đã gửi). Vì vậy sau khi gọi fn() đồng bộ xong,
 * nếu response đã được gửi (res.statusCode có giá trị) thì phải resolve ngay, thay vì
 * chờ next() vô thời hạn — nếu không Promise sẽ treo mãi mãi (đây là lỗi có thật đã tồn tại
 * trong bản gốc src/scripts/runMultipleChoiceValidatorTests.js, khiến các case "expected
 * reject" không bao giờ thực sự được assert).
 */
export const runMiddleware = async (middleware, req, res) => {
  for (const fn of middleware) {
    let settled = false;
    await new Promise((resolve, reject) => {
      const next = (err) => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };

      try {
        fn(req, res, next);
      } catch (error) {
        if (settled) return;
        settled = true;
        reject(error);
        return;
      }

      if (!settled && res.statusCode) {
        settled = true;
        resolve();
      }
    });

    if (res.statusCode) {
      return false;
    }
  }
  return true;
};

/**
 * handleValidationErrors (src/utils/validators.js) trả về message tổng quát ở top-level
 * và message cụ thể theo từng field trong mảng `errors`. Gom cả hai lại thành 1 chuỗi để
 * test có thể kiểm tra nội dung message cụ thể mà không cần biết chính xác nó nằm ở đâu.
 */
export const extractErrorMessages = (res) => {
  const top = typeof res.body?.message === "string" ? res.body.message : "";
  const fieldMessages = Array.isArray(res.body?.errors)
    ? res.body.errors.map((e) => e.message).join(" | ")
    : "";
  return `${top} ${fieldMessages}`.trim();
};
