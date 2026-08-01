// Chốt các tính chất của bảng query key tập trung.
//
// Test ở đây không kiểm từng key một — nó DUYỆT toàn bộ object và kiểm các quy tắc. Khác biệt
// quan trọng: thêm key mới sai quy ước sẽ đỏ ngay, kể cả khi không ai nhớ sửa test này.
//
// Đó là điều mà một danh sách assert viết tay không làm được: nó chỉ bảo vệ những gì đã có
// vào lúc viết.
import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { QUERY_ROOTS, queryKeys } from "../src/shared/api/queryKeys";

type KeyGroup = Record<string, unknown>;

/** Lấy tất cả key thực tế của một nhóm: mảng tĩnh dùng luôn, hàm thì gọi với đối số mẫu. */
const materializeGroup = (group: KeyGroup): { name: string; key: readonly unknown[] }[] =>
  Object.entries(group).map(([name, value]) => ({
    name,
    key: typeof value === "function" ? value("mau-1", "mau-2", { loc: 1 }) : (value as unknown[]),
  }));

const GROUPS = Object.entries(queryKeys) as [keyof typeof queryKeys, KeyGroup][];

describe("queryKeys — quy ước cấu trúc", () => {
  it("mọi nhóm đều có key `all` để làm mới cả nhánh", () => {
    for (const [groupName, group] of GROUPS) {
      expect(group.all, `nhóm "${groupName}" thiếu key all`).toBeDefined();
    }
  });

  it("MỌI key đều bắt đầu bằng gốc của nhóm mình", () => {
    // Đây là tính chất khiến invalidateQueries theo tiền tố hoạt động. Bản cũ không có nó:
    // ["student-classes","mine"] và ["class-detail", id] là hai nhánh rời nhau, không có cách
    // nào làm mới cả cụm lớp học bằng một lời gọi.
    for (const [groupName, group] of GROUPS) {
      const root = QUERY_ROOTS[groupName];
      for (const { name, key } of materializeGroup(group)) {
        expect(key[0], `queryKeys.${groupName}.${name} phải bắt đầu bằng "${root}"`).toBe(root);
      }
    }
  });

  it("mỗi nhóm có gốc RIÊNG, không nhóm nào trùng gốc nhóm khác", () => {
    const roots = Object.values(QUERY_ROOTS);
    expect(new Set(roots).size).toBe(roots.length);
  });

  it("không có hai key nào trùng nhau trên toàn ứng dụng", () => {
    // Hai key trùng nghĩa là hai màn hình dùng chung một ô cache — dữ liệu lẫn vào nhau.
    const seen = new Map<string, string>();
    for (const [groupName, group] of GROUPS) {
      for (const { name, key } of materializeGroup(group)) {
        const serialized = JSON.stringify(key);
        const owner = `${groupName}.${name}`;
        expect(
          seen.get(serialized),
          `${owner} trùng key với ${seen.get(serialized)}`
        ).toBeUndefined();
        seen.set(serialized, owner);
      }
    }
  });

  it("key nào cũng chỉ chứa giá trị tuần tự hoá được", () => {
    // React Query băm key bằng JSON. Lọt một hàm hay Symbol vào đây thì cache hành xử
    // khó đoán mà không báo lỗi gì.
    for (const [groupName, group] of GROUPS) {
      for (const { name, key } of materializeGroup(group)) {
        expect(() => JSON.stringify(key), `queryKeys.${groupName}.${name}`).not.toThrow();
        expect(Array.isArray(key), `queryKeys.${groupName}.${name} phải là mảng`).toBe(true);
      }
    }
  });
});

describe("queryKeys — hành vi từng nhóm", () => {
  it("làm mới nhánh lớp học phủ được mọi truy vấn con", () => {
    const branch = queryKeys.class.all;
    const children = [
      queryKeys.class.myClasses,
      queryKeys.class.detail("c1"),
      queryKeys.class.attendance("c1"),
      queryKeys.class.attendanceByDate("c1", "2026-03-10"),
      queryKeys.class.grades("c1"),
      queryKeys.class.courseOptions,
    ];

    for (const child of children) {
      expect(child.slice(0, branch.length)).toEqual([...branch]);
    }
  });

  it("id khác nhau cho ra key khác nhau", () => {
    expect(queryKeys.class.detail("c1")).not.toEqual(queryKeys.class.detail("c2"));
    expect(queryKeys.lesson.summary("l1")).not.toEqual(queryKeys.lesson.summary("l2"));
  });

  it("id undefined vẫn tạo được key hợp lệ — dùng cho query đang tắt", () => {
    // Các hook gọi factory NGAY CẢ KHI chưa có id (enabled: false). Ném lỗi ở đây sẽ làm sập
    // component trước khi query kịp bị tắt.
    expect(() => queryKeys.class.detail(undefined)).not.toThrow();
    expect(queryKeys.class.detail(undefined)[0]).toBe(QUERY_ROOTS.class);
  });

  it("thùng rác và danh sách đang dùng là hai ô cache tách biệt", () => {
    const filters = { page: 1 };
    expect(queryKeys.adminList.list("accounts", true, filters)).not.toEqual(
      queryKeys.adminList.list("accounts", false, filters)
    );
  });

  it("hai tài nguyên quản trị khác nhau không lẫn cache", () => {
    const filters = { page: 1 };
    expect(queryKeys.adminList.list("accounts", false, filters)).not.toEqual(
      queryKeys.adminList.list("courses", false, filters)
    );
  });

  it("bộ lọc nằm trong key, đổi bộ lọc là đổi truy vấn", () => {
    expect(queryKeys.adminList.list("accounts", false, { page: 1 })).not.toEqual(
      queryKeys.adminList.list("accounts", false, { page: 2 })
    );
  });
});

describe("queryKeys — làm mới theo tiền tố CHẠY THẬT trên QueryClient", () => {
  // Các test trên chốt hình dạng mảng. Test này chốt rằng hình dạng đó thật sự cho ra hành vi
  // mong muốn — đó mới là lý do tồn tại của cả quy ước. Hai thứ có thể lệch nhau: mảng đúng
  // tiền tố nhưng dùng sai API invalidateQueries thì vẫn không làm mới gì.
  const setup = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const calls = { detail: 0, grades: 0, notification: 0 };

    const fetchAll = () =>
      Promise.all([
        client.fetchQuery({
          queryKey: queryKeys.class.detail("c1"),
          queryFn: async () => ++calls.detail,
        }),
        client.fetchQuery({
          queryKey: queryKeys.class.grades("c1"),
          queryFn: async () => ++calls.grades,
        }),
        client.fetchQuery({
          queryKey: queryKeys.notification.list,
          queryFn: async () => ++calls.notification,
        }),
      ]);

    await fetchAll();
    return { client, calls };
  };

  it("làm mới gốc `class` đánh dấu cũ MỌI truy vấn lớp học, không đụng nhóm khác", async () => {
    const { client } = await setup();

    await client.invalidateQueries({ queryKey: queryKeys.class.all, refetchType: "none" });

    expect(client.getQueryState(queryKeys.class.detail("c1"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.class.grades("c1"))?.isInvalidated).toBe(true);
    // Thông báo là nhóm khác — không được dính.
    expect(client.getQueryState(queryKeys.notification.list)?.isInvalidated).toBe(false);
  });

  it("làm mới một lớp cụ thể không đụng lớp khác", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await client.fetchQuery({ queryKey: queryKeys.class.detail("c1"), queryFn: async () => 1 });
    await client.fetchQuery({ queryKey: queryKeys.class.detail("c2"), queryFn: async () => 2 });

    await client.invalidateQueries({
      queryKey: queryKeys.class.detail("c1"),
      refetchType: "none",
    });

    expect(client.getQueryState(queryKeys.class.detail("c1"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.class.detail("c2"))?.isInvalidated).toBe(false);
  });
});
