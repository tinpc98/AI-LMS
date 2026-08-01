// File: src/shared/utils/asyncHandler.js
// Bọc một route handler async để mọi lỗi (kể cả promise bị reject) tự động đi tới
// errorHandler tập trung, thay vì mỗi controller tự try/catch rồi trả 500 theo cách riêng.
//
// VÌ SAO CẦN (§4.4): trước Wave 4, 47 chỗ trong các controller lặp lại đúng một khuôn:
//
//     } catch (error) {
//       return res.status(500).json({ message: "...", error: error.message });
//     }
//
// Ba vấn đề của khuôn đó:
//   1. Nuốt status thật. Service ném lỗi kèm err.status = 404/403, nhưng catch này ép
//      hết thành 500 — client nhận sai mã lỗi.
//   2. Rò rỉ chi tiết nội bộ ra production qua field `error: error.message`.
//   3. Mất requestId, nên log không truy vết được về request nào.
//
// errorHandler tập trung đã xử lý cả ba từ Wave 1, nhưng chỉ nhận được lỗi khi controller
// CHỊU ném ra. asyncHandler chính là mảnh còn thiếu để lỗi tới được đó.
//
// Lưu ý: Express 5 đã tự bắt promise reject trong handler async. Vẫn dùng wrapper này vì
// nó tường minh, và vì mục đích chính là XOÁ các khối try/catch nuốt lỗi — không phải chỉ
// để bắt promise.

/**
 * @param {Function} fn - route handler (async hoặc sync)
 * @returns {Function} handler đã bọc, mọi lỗi được chuyển cho next()
 *
 * Dùng try/catch quanh `await` thay vì khuôn phổ biến `Promise.resolve(fn(...)).catch(next)`.
 * Khuôn đó KHÔNG bắt được lỗi ném ĐỒNG BỘ: fn() được gọi trước khi Promise.resolve kịp bọc,
 * nên lỗi thoát ra ngoài wrapper. Test tests/unit/shared/asyncHandler.test.js chốt lại điều
 * này. Trên thực tế Express vẫn tự bắt throw đồng bộ, nhưng để wrapper tự lo được cả hai
 * trường hợp thì hành vi không phụ thuộc vào chi tiết của framework.
 */
export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};

export default asyncHandler;
