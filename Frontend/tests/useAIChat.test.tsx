// Chốt việc dọn phiên trò chuyện khi người dùng chuyển sang bài học khác.
//
// Đây là nhóm B của đợt sửa react-hooks/set-state-in-effect: "đặt lại state khi prop đổi".
// Bản cũ dọn state trong useEffect, nên có một nhịp render mang lessonId MỚI nhưng vẫn kèm
// đoạn hội thoại của bài CŨ. Với khung chat thì đó là lỗi nhìn thấy rõ.
//
// CÁCH ĐO PHẢI CHỌN ĐÚNG. Ở tests/useResponsiveLayout.test.ts tôi đếm số lần hàm component
// được gọi, và cách đó đúng cho trường hợp kia. Ở đây nó SAI: mẫu "adjust state during
// render" vẫn gọi hàm component hai lần — khác biệt nằm ở chỗ lượt đầu bị React VỨT BỎ,
// không bao giờ ra tới màn hình. Tôi viết bản đếm-lời-gọi trước và nó báo đỏ ngay cả trên
// mã đã sửa, tức là nó đang đo nhầm đại lượng.
//
// Đại lượng đúng là "những lượt render ĐƯỢC GHI NHẬN (commit)" — thứ người dùng thật sự
// nhìn thấy. React chỉ chạy effect cho các lượt đã commit, nên một useEffect không có mảng
// phụ thuộc chính là đầu dò chuẩn.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { renderHook, act } from "@testing-library/react";
import { useAIChat } from "../src/features/ai/hooks/useAIChat";

vi.mock("../src/api/aiApi", () => ({
  default: {
    createChatSession: vi.fn(),
    getChatHistory: vi.fn(),
    sendChatMessage: vi.fn(),
  },
}));
vi.mock("../src/utils/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import aiApi from "../src/api/aiApi";

const mockSession = (lessonId: string) => ({
  id: `session-${lessonId}`,
  messages: [{ role: "assistant" as const, content: `Xin chào, đây là bài ${lessonId}` }],
});

beforeEach(() => {
  vi.mocked(aiApi.createChatSession).mockImplementation(async (lessonId: string) =>
    mockSession(lessonId)
  );
});

describe("useAIChat — đổi bài học", () => {
  it("KHÔNG có lượt hiển thị nào ghép bài mới với hội thoại của bài cũ", async () => {
    // Đầu dò: effect không có mảng phụ thuộc, chạy sau MỖI lượt commit. Lượt render bị React
    // vứt bỏ không chạy effect, nên mảng này chỉ chứa những gì thật sự lên màn hình.
    //
    // Bản cũ (dọn trong useEffect) commit lượt render mang lessonId "bai-2" kèm tin nhắn của
    // "bai-1", rồi mới commit lượt đã dọn -> lọt một cặp ("bai-2", 1).
    const commits: Array<{ lessonId: string; messageCount: number }> = [];

    const { result, rerender } = renderHook(
      ({ lessonId }) => {
        const chat = useAIChat(lessonId);
        useEffect(() => {
          commits.push({ lessonId, messageCount: chat.messages.length });
        });
        return chat;
      },
      { initialProps: { lessonId: "bai-1" } }
    );

    await act(async () => {
      await result.current.initSession();
    });
    expect(result.current.messages).toHaveLength(1);

    commits.length = 0; // chỉ quan tâm những gì hiển thị KỂ TỪ lúc đổi bài
    rerender({ lessonId: "bai-2" });

    const roViBaiCu = commits.filter((c) => c.lessonId === "bai-2" && c.messageCount > 0);
    expect(roViBaiCu).toEqual([]);
    expect(commits.length).toBeGreaterThan(0); // đầu dò có chạy, không phải pass vì rỗng
  });

  it("dọn sạch phiên, lỗi và trạng thái khởi tạo khi đổi bài", async () => {
    const { result, rerender } = renderHook(({ lessonId }) => useAIChat(lessonId), {
      initialProps: { lessonId: "bai-1" },
    });

    await act(async () => {
      await result.current.initSession();
    });
    expect(result.current.session?.id).toBe("session-bai-1");
    expect(result.current.initStatus).toBe("ready");

    rerender({ lessonId: "bai-2" });

    expect(result.current.session).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.initStatus).toBe("idle");
    expect(result.current.isLoading).toBe(false);
  });

  it("render lại với CÙNG bài học thì không đụng tới hội thoại đang có", async () => {
    const { result, rerender } = renderHook(({ lessonId }) => useAIChat(lessonId), {
      initialProps: { lessonId: "bai-1" },
    });

    await act(async () => {
      await result.current.initSession();
    });

    rerender({ lessonId: "bai-1" });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.initStatus).toBe("ready");
  });

  it("khởi tạo lại được sau khi quay về bài học cũ (A -> B -> A)", async () => {
    // Khoá chống khởi tạo trùng nằm trong một ref không bị đặt lại lúc render. Test này
    // chốt rằng bỏ việc đặt lại ref đó KHÔNG làm kẹt phiên khi người dùng quay lại bài cũ:
    // khoá là `lessonId:<id>` nên lúc về A nó đang giữ giá trị của B, vẫn không khớp.
    const { result, rerender } = renderHook(({ lessonId }) => useAIChat(lessonId), {
      initialProps: { lessonId: "bai-1" },
    });

    await act(async () => {
      await result.current.initSession();
    });
    rerender({ lessonId: "bai-2" });
    await act(async () => {
      await result.current.initSession();
    });
    rerender({ lessonId: "bai-1" });
    await act(async () => {
      await result.current.initSession();
    });

    expect(result.current.session?.id).toBe("session-bai-1");
    expect(result.current.initStatus).toBe("ready");
    expect(vi.mocked(aiApi.createChatSession).mock.calls.map(([id]) => id)).toEqual([
      "bai-1",
      "bai-2",
      "bai-1",
    ]);
  });

  it("không gọi API khi thiếu lessonId, báo lỗi rõ ràng", async () => {
    const { result } = renderHook(() => useAIChat(undefined));

    await act(async () => {
      await result.current.initSession();
    });

    expect(aiApi.createChatSession).not.toHaveBeenCalled();
    expect(result.current.initStatus).toBe("error");
    expect(result.current.error).toContain("ngữ cảnh bài học");
  });
});
