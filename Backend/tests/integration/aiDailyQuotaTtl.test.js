// Integration test — cần MongoDB thật tại MONGO_TEST_URI.
//
// VÌ SAO PHẢI LÀ INTEGRATION TEST
//
// Khai báo `schema.index({ createdAt: 1 }, { expireAfterSeconds })` trong mã KHÔNG đảm bảo
// index tồn tại trong cơ sở dữ liệu. MongoDB từ chối tạo index nếu đã có một index trùng khoá
// với tuỳ chọn khác (IndexOptionsConflict), và Mongoose nuốt lỗi đó vào sự kiện "index" chứ
// không ném ra. Một unit test đọc `schema.indexes()` sẽ xanh trong khi thực tế không có TTL
// nào cả — đúng kiểu "phép kiểm không thể fail" đã gặp hôm nay với tsc --noEmit.
//
// Nên test này hỏi thẳng MongoDB: index có ở đó không, và expireAfterSeconds bằng bao nhiêu.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import AIDailyQuota from "#modules/ai/models/aiDailyQuota.model.js";

const TEST_URI = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/ai_lms_test";
const BAY_NGAY_GIAY = 7 * 24 * 60 * 60;

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
  // syncIndexes dựng lại đúng bộ index mà schema khai báo — kể cả khi collection đã tồn tại
  // với bộ index cũ. Đây cũng là lệnh cần chạy khi triển khai lên môi trường đã có dữ liệu.
  await AIDailyQuota.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("AIDailyQuota — TTL index", () => {
  it("index TTL TỒN TẠI THẬT trong MongoDB, không chỉ trong khai báo schema", async () => {
    const indexes = await AIDailyQuota.collection.indexes();
    const ttl = indexes.find((idx) => idx.expireAfterSeconds !== undefined);

    expect(ttl, "không tìm thấy index nào có expireAfterSeconds").toBeTruthy();
    expect(ttl.key).toEqual({ createdAt: 1 });
  });

  it("hạn xoá đúng 7 ngày", async () => {
    const indexes = await AIDailyQuota.collection.indexes();
    const ttl = indexes.find((idx) => idx.expireAfterSeconds !== undefined);

    // Chốt con số: 1 ngày sẽ làm hỏng việc hoàn trả lượt cho request treo qua nửa đêm; quá
    // dài thì mất tác dụng chặn phình. Xem lý giải trong aiDailyQuota.model.js.
    expect(ttl.expireAfterSeconds).toBe(BAY_NGAY_GIAY);
  });

  it("index unique cũ vẫn còn — TTL không được thay thế nó", async () => {
    // Index unique {userId, dateString} là thứ bảo đảm phép UPSERT nguyên tử khi trừ lượt.
    // Mất nó thì hai request đồng thời có thể tạo hai document và hạn mức đếm sai.
    const indexes = await AIDailyQuota.collection.indexes();
    const unique = indexes.find(
      (idx) => idx.key?.userId === 1 && idx.key?.dateString === 1 && idx.unique
    );

    expect(unique, "mất index unique {userId, dateString}").toBeTruthy();
  });

  it("bản ghi mới KHÔNG bị xoá ngay — TTL tính từ createdAt", async () => {
    const userId = new mongoose.Types.ObjectId();
    await AIDailyQuota.deleteMany({ userId });

    const doc = await AIDailyQuota.create({ userId, dateString: "2026-08-01", usageCount: 1 });

    expect(doc.createdAt).toBeInstanceOf(Date);
    // Còn cách hạn xoá đúng 7 ngày kể từ lúc tạo.
    const hanXoa = doc.createdAt.getTime() + BAY_NGAY_GIAY * 1000;
    expect(hanXoa).toBeGreaterThan(Date.now());

    await AIDailyQuota.deleteMany({ userId });
  });
});
