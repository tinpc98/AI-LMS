// Chốt tính ổn định của số liệu minh hoạ trong module Report.
//
// Trước đây ba chỗ gọi Math.random() ngay trong lúc render, nên mỗi lần vẽ lại là một bộ số
// khác. Test quan trọng nhất ở đây là "gọi nhiều lần vẫn ra cùng kết quả" — nếu ai đó thay
// stableMetric bằng random cho nhanh, nó phải đỏ.
import { describe, it, expect } from "vitest";
import { stableMetric } from "../src/features/report/demoMetrics";

describe("stableMetric", () => {
  it("cùng đầu vào luôn cho cùng kết quả", () => {
    const first = stableMetric("lop-1", "attendance", 90, 99);
    for (let i = 0; i < 50; i++) {
      expect(stableMetric("lop-1", "attendance", 90, 99)).toBe(first);
    }
  });

  it("luôn nằm trong khoảng yêu cầu, kể cả với đầu vào lạ", () => {
    const inputs = ["", "a", "lop-999", "Nguyễn Văn Đức", "🙂", "x".repeat(500)];
    for (const seed of inputs) {
      const value = stableMetric(seed, "salt", 90, 99);
      expect(value).toBeGreaterThanOrEqual(90);
      expect(value).toBeLessThanOrEqual(99);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("khoảng chỉ có một giá trị thì luôn trả đúng giá trị đó", () => {
    expect(stableMetric("bất kỳ", "salt", 7, 7)).toBe(7);
  });

  it("salt khác nhau cho ra số khác nhau trên cùng một seed", () => {
    // Không có salt thì tỉ lệ điểm danh và tỉ lệ đúng giờ của một lớp sẽ luôn bằng nhau —
    // nhìn là biết ngay số giả.
    const a = stableMetric("lop-1", "attendance", 0, 1000);
    const b = stableMetric("lop-1", "onTime", 0, 1000);
    expect(a).not.toBe(b);
  });

  it("seed khác nhau trải đều, không dồn hết vào một giá trị", () => {
    // Băm tồi thì mọi lớp hiện cùng một con số, trông giả rõ hơn cả random.
    const values = new Set(
      Array.from({ length: 60 }, (_, i) => stableMetric(`lop-${i}`, "attendance", 90, 99))
    );
    expect(values.size).toBeGreaterThanOrEqual(8); // gần kín 10 giá trị có thể
  });
});
