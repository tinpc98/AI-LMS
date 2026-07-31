// Test cho việc tách main.js -> app.js + server.js (Wave 2.4).
//
// Nằm ở tests/unit chứ không phải tests/integration vì KHÔNG cần MongoDB: đây chính là
// điều mà việc tách nhắm tới — dựng được Express app để kiểm thử qua supertest mà không
// mở cổng, không kết nối DB, không chạy cron hay socket.
//
// Test này cũng là rào chắn: nếu ai đó lỡ đưa lại việc connectDB/listen vào app.js,
// nó sẽ treo hoặc ném lỗi ở đây thay vì lộ ra lúc chạy thật.
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

let app;

beforeAll(() => {
  app = createApp();
});

describe("createApp", () => {
  it("dựng được Express app mà không cần kết nối DB hay mở cổng", () => {
    expect(typeof app).toBe("function");
    expect(typeof app.listen).toBe("function");
  });

  it("GET / trả 200 kèm thông điệp trạng thái", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("EduSynth AI");
  });

  it("GET /health trả 503 khi chưa kết nối MongoDB (readyState !== 1)", async () => {
    // Không có DB trong unit test, nên health check phải báo chưa sẵn sàng —
    // đúng hành vi mà orchestrator cần để không route traffic vào container chưa sẵn sàng.
    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("unavailable");
    expect(res.body).toHaveProperty("uptime");
  });

  it("đường dẫn không tồn tại đi vào notFoundHandler thay vì rơi ra ngoài", async () => {
    const res = await request(app).get("/khong-ton-tai");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("router /api được mount: gọi endpoint cần đăng nhập trả 401 chứ không phải 404", async () => {
    // Phân biệt "route chưa mount" (404) với "route đã mount và chặn bởi xác thực" (401).
    const res = await request(app).get("/api/classes");
    expect(res.status).toBe(401);
  });

  it("bật helmet: có header bảo mật X-Content-Type-Options", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("gắn requestId cho mỗi request để log truy vết được", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });
});

// Chốt sơ đồ URL sau khi gỡ alias trùng (Wave 2.5). Dùng 404 vs 401 để phân biệt
// "route không tồn tại" với "route tồn tại nhưng bị chặn bởi xác thực".
describe("sơ đồ mount API sau khi gỡ alias trùng", () => {
  it("/api/auth/login vẫn tồn tại (Frontend đang dùng)", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).not.toBe(404);
  });

  it("/api/users vẫn tồn tại và yêu cầu đăng nhập (Frontend đang dùng)", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("/api/lessons còn, /api/lesson số ít đã gỡ", async () => {
    // lesson.routes.js không có route gốc "/", nên phải dùng một đường dẫn có thật
    // (/class/:classId) để phân biệt "router đã mount" với "đã gỡ hẳn".
    expect((await request(app).get("/api/lessons/class/abc")).status).toBe(401);
    expect((await request(app).get("/api/lesson/class/abc")).status).toBe(404);
  });

  it("endpoint quản trị người dùng KHÔNG còn truy cập được qua /api/auth", async () => {
    // Trước Wave 2.5 cùng một router mount ở cả hai prefix, nên GET /api/auth
    // liệt kê được toàn bộ user. Nay chỉ /api/users mới làm được việc đó.
    expect((await request(app).get("/api/auth")).status).toBe(404);
    expect((await request(app).get("/api/auth/trash")).status).toBe(404);
  });

  it("đăng nhập KHÔNG còn truy cập được qua /api/users/login", async () => {
    expect((await request(app).post("/api/users/login").send({})).status).toBe(404);
  });
});
