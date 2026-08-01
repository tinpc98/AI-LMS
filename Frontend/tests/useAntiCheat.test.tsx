// Chốt rằng hook chống gian lận luôn gọi PHIÊN BẢN MỚI NHẤT của callback.
//
// Vì sao đáng test: ExamPage đưa vào đây một hàm đọc `answers` và `questions` từ state, và
// khi học sinh vi phạm đủ số lần thì hàm đó NỘP BÀI CƯỠNG BỨC. Nếu hook giữ callback cũ, bài
// nộp lên sẽ mang dữ liệu của thời điểm mount — tức là rỗng — và học sinh mất trắng bài làm.
//
// Đó chính là bug đã tồn tại: ExamPage bọc callback trong useCallback với hai phụ thuộc không
// bao giờ đổi, còn hook thì đặt callback vào mảng phụ thuộc của effect. Không lỗi nào lộ ra
// khi bấm thử, vì phải vi phạm đủ 5 lần mới chạm tới nhánh nộp bài.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import useAntiCheat from "../src/features/exam/hooks/useAntiCheat";

// Hook có cơ chế chống dội 1 giây giữa hai lần cảnh báo. Dùng đồng hồ giả để điều khiển.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const fireBlur = () => act(() => void window.dispatchEvent(new Event("blur")));
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

// PHẠM VI CỦA FILE NÀY — nói rõ để không ai tưởng nó phủ nhiều hơn thực tế.
//
// Bug ở ExamPage cần HAI thay đổi mới hết: (1) hook giữ callback trong ref, (2) ExamPage bỏ
// useCallback. Kiểm chứng ngược cho thấy chỉ test "không gắn lại listener" là đỏ khi hoàn
// nguyên hook; test "callback mới nhất" thì XANH CẢ HAI BÊN — vì bản cũ gắn lại listener mỗi
// khi callback đổi, nên nó cũng lấy được bản mới.
//
// Nói cách khác, phần (2) — chỗ thật sự gây mất bài làm — không có test tự động ở đây. Muốn
// có thì phải dựng cả ExamPage cùng axios, router và fullscreen API. Tôi đã xác minh phần đó
// bằng cách đọc mã và lần theo closure, không phải bằng test; ghi lại để người sau biết đúng
// mức độ bảo vệ hiện có.
describe("useAntiCheat — hợp đồng với nơi gọi", () => {
  it("gọi callback của lần render hiện tại (đúng ở cả bản cũ lẫn bản mới)", () => {
    // Test hợp đồng, KHÔNG phải test hồi quy: bản cũ cũng pass. Giữ lại vì nó chốt hành vi
    // mà mọi bản cài đặt tương lai phải giữ.
    const seen: string[] = [];

    const { result } = renderHook(() => {
      const [baiLam, setBaiLam] = useState("chưa làm gì");
      useAntiCheat(() => seen.push(baiLam));
      return { setBaiLam };
    });

    act(() => result.current.setBaiLam("đã trả lời 10 câu"));
    fireBlur();

    expect(seen).toEqual(["đã trả lời 10 câu"]);
  });

  it("callback đổi identity mỗi lần render vẫn KHÔNG gắn lại listener", () => {
    // ĐÂY là test hồi quy thật của commit này (kiểm chứng ngược: hoàn nguyên hook -> đỏ,
    // "expected 4 to be 1").
    //
    // Nó chốt điều khiến bug không thể tái diễn: nơi gọi KHÔNG CÒN LÝ DO phải memo hoá
    // callback. Chính sức ép phải memo hoá — để tránh gỡ/gắn lại 7 listener mỗi lần render —
    // đã đẩy ExamPage vào chỗ đóng băng callback ở lần render đầu.
    const addSpy = vi.spyOn(window, "addEventListener");
    const { rerender } = renderHook(() => useAntiCheat(() => {}));
    const soLanBanDau = addSpy.mock.calls.filter(([e]) => e === "blur").length;

    rerender();
    rerender();
    rerender();

    expect(addSpy.mock.calls.filter(([e]) => e === "blur").length).toBe(soLanBanDau);
    addSpy.mockRestore();
  });
});

describe("useAntiCheat — đếm vi phạm", () => {
  it("đếm tăng dần qua các lần vi phạm", () => {
    const onCheat = vi.fn();
    renderHook(() => useAntiCheat(onCheat));

    fireBlur();
    advance(1500); // vượt qua ngưỡng chống dội
    fireBlur();

    expect(onCheat.mock.calls.map(([, n]) => n)).toEqual([1, 2]);
  });

  it("chống dội: hai sự kiện sát nhau chỉ tính MỘT lần vi phạm", () => {
    // Chuyển tab thường phát cả blur lẫn visibilitychange gần như cùng lúc. Không chống dội
    // thì một thao tác bị tính thành hai lần vi phạm, và học sinh bị đình chỉ oan.
    const onCheat = vi.fn();
    renderHook(() => useAntiCheat(onCheat));

    fireBlur();
    fireBlur();
    fireBlur();

    expect(onCheat).toHaveBeenCalledTimes(1);
  });

  it("gỡ listener khi rời trang — không cảnh báo nữa", () => {
    const onCheat = vi.fn();
    const { unmount } = renderHook(() => useAntiCheat(onCheat));

    unmount();
    fireBlur();

    expect(onCheat).not.toHaveBeenCalled();
  });
});
