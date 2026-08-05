// LƯỚI AN TOÀN CHO VIỆC DI CHUYỂN FILE (Wave 5 / §7.1).
//
// VÌ SAO TEST NÀY TỒN TẠI:
// App.tsx nạp 30 màn hình bằng React.lazy(() => import("...")). Đường dẫn trong các
// import động đó là CHUỖI — TypeScript kiểm được lúc biên dịch, nhưng nếu một file bị
// đổi chỗ mà quên sửa chuỗi thì `tsc` báo lỗi, còn nếu sửa sai thành một module KHÁC có
// tồn tại thì tsc im lặng và lỗi chỉ lộ ra khi người dùng bấm vào menu đó.
//
// Test này nạp THẬT từng module lazy và khẳng định nó export default một component. Đó
// là kiểm tra mà tsc và vite build đều không làm: build chỉ cần module tồn tại, không
// quan tâm nó có phải component hay không, cũng không phát hiện hai route trỏ nhầm nhau.
//
// Chạy trước và sau mỗi bước di chuyển file ở Wave 5.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const APP = path.resolve(__dirname, "../src/App.tsx");
const source = fs.readFileSync(APP, "utf8");

/** Rút mọi cặp [tênBiến, đườngDẫn] từ các khai báo lazy() trong App.tsx. */
const lazyModules = [
  ...source.matchAll(/const (\w+) = lazy\(\s*\(\) =>\s*import\("([^"]+)"\)/g),
].map((m) => ({ name: m[1], importPath: m[2] }));

describe("Các màn hình lazy trong App.tsx", () => {
  it("App.tsx thật sự khai báo màn hình lazy (nếu regex hỏng thì test này sẽ báo)", () => {
    expect(lazyModules.length).toBeGreaterThan(20);
  });

  it.each(lazyModules.map((m) => [m.name, m.importPath]))(
    "%s nạp được và export default một component",
    async (_name, importPath) => {
      const mod = await import(/* @vite-ignore */ importPath.replace(/^\.\//, "../src/"));
      expect(mod.default, `${importPath} không có export default`).toBeDefined();
      // Component React là function hoặc object (memo/forwardRef trả về object).
      expect(["function", "object"]).toContain(typeof mod.default);
    },
    20000
  );

  it("không có hai route lazy nào trỏ vào cùng một file (dấu hiệu copy-paste sai)", () => {
    const byPath = new Map<string, string[]>();
    for (const m of lazyModules) {
      if (!byPath.has(m.importPath)) byPath.set(m.importPath, []);
      byPath.get(m.importPath)!.push(m.name);
    }
    const duplicated = [...byPath.entries()].filter(([, names]) => names.length > 1);
    expect(
      duplicated,
      `Các biến sau cùng trỏ vào một file: ${JSON.stringify(duplicated)}`
    ).toHaveLength(0);
  });
});
