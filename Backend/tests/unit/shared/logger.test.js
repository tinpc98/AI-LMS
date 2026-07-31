// Chốt hành vi lọc theo mức của logger.
//
// Điều đáng kiểm nhất: mức được đọc LẠI ở mỗi lần ghi, không chốt lúc nạp module. Chốt sẵn là
// một cái bẫy im lặng — đặt LOG_LEVEL sau khi import sẽ không có tác dụng, và người ta sẽ
// tưởng logger hỏng trong khi thật ra nó đọc giá trị từ lúc khởi động.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "#shared/utils/logger.js";

const MOI_TRUONG_GOC = { LOG_LEVEL: process.env.LOG_LEVEL, NODE_ENV: process.env.NODE_ENV };

let spies;

beforeEach(() => {
  spies = {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env.LOG_LEVEL = MOI_TRUONG_GOC.LOG_LEVEL;
  process.env.NODE_ENV = MOI_TRUONG_GOC.NODE_ENV;
  if (MOI_TRUONG_GOC.LOG_LEVEL === undefined) delete process.env.LOG_LEVEL;
  if (MOI_TRUONG_GOC.NODE_ENV === undefined) delete process.env.NODE_ENV;
});

const datMuc = (level) => {
  process.env.LOG_LEVEL = level;
};

describe("logger — lọc theo mức", () => {
  it("mức debug thì ghi tất cả", () => {
    datMuc("debug");

    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");

    expect(spies.log).toHaveBeenCalledTimes(2); // debug + info
    expect(spies.warn).toHaveBeenCalledTimes(1);
    expect(spies.error).toHaveBeenCalledTimes(1);
  });

  it("mức info thì BỎ QUA debug", () => {
    // Đây là cấu hình của production: chi tiết socket/request bị lọc, phần còn lại giữ nguyên.
    datMuc("info");

    logger.debug("khong-duoc-ghi");
    logger.info("duoc-ghi");

    expect(spies.log).toHaveBeenCalledTimes(1);
    expect(spies.log).toHaveBeenCalledWith("duoc-ghi");
  });

  it("mức error thì chỉ còn lỗi", () => {
    datMuc("error");

    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");

    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.warn).not.toHaveBeenCalled();
    expect(spies.error).toHaveBeenCalledTimes(1);
  });

  it("mức silent thì im lặng hoàn toàn, kể cả lỗi", () => {
    datMuc("silent");

    logger.error("e");
    logger.warn("w");

    expect(spies.error).not.toHaveBeenCalled();
    expect(spies.warn).not.toHaveBeenCalled();
  });
});

describe("logger — mức mặc định suy từ NODE_ENV", () => {
  beforeEach(() => delete process.env.LOG_LEVEL);

  it("production mặc định là info — debug bị lọc", () => {
    process.env.NODE_ENV = "production";

    logger.debug("khong-duoc-ghi");
    logger.info("duoc-ghi");

    expect(spies.log).toHaveBeenCalledTimes(1);
  });

  it("test mặc định im lặng — log rác không làm nhiễu kết quả test", () => {
    process.env.NODE_ENV = "test";

    logger.debug("d");
    logger.info("i");
    logger.error("e");

    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.error).not.toHaveBeenCalled();
  });

  it("development ghi tất cả", () => {
    process.env.NODE_ENV = "development";

    logger.debug("d");

    expect(spies.log).toHaveBeenCalledTimes(1);
  });
});

describe("logger — đọc lại mức ở MỖI lần ghi", () => {
  it("đổi LOG_LEVEL sau khi import vẫn có hiệu lực", () => {
    // Nếu mức bị chốt lúc nạp module, test này đỏ. Đó là bẫy im lặng: người ta đặt biến môi
    // trường rồi tưởng logger hỏng, trong khi nó đang dùng giá trị từ lúc khởi động.
    datMuc("error");
    logger.info("bi-loc");
    expect(spies.log).not.toHaveBeenCalled();

    datMuc("debug");
    logger.info("duoc-ghi");
    expect(spies.log).toHaveBeenCalledTimes(1);
  });

  it("LOG_LEVEL không hợp lệ thì quay về mặc định theo NODE_ENV, không sập", () => {
    process.env.NODE_ENV = "production";
    datMuc("khong-phai-muc-hop-le");

    logger.debug("khong-duoc-ghi");
    logger.info("duoc-ghi");

    expect(spies.log).toHaveBeenCalledTimes(1);
  });

  it("chuyển tiếp nguyên vẹn mọi tham số", () => {
    datMuc("debug");
    const obj = { a: 1 };

    logger.info("thông điệp", obj, 42);

    expect(spies.log).toHaveBeenCalledWith("thông điệp", obj, 42);
  });
});
