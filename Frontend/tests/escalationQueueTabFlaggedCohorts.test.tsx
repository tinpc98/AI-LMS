// Mục "Cohort cần xem xét đóng sớm (BR-14)" trong EscalationQueueTab — nhánh có dữ liệu thật
// (bảng hiện tên lớp/giáo viên/thời điểm bị đánh dấu) khó tạo qua trình duyệt vì cần huỷ thật 2
// buổi học liên tiếp trên cùng 1 cohort (mutating dữ liệu session thật, không đảo ngược được qua
// UI) — chốt nhánh này bằng test mock dữ liệu trả về đúng hình dạng backend đã trả.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EscalationQueueTab } from "../src/features/cohort-mechanism/components/EscalationQueueTab";

const listOverdueSessions = vi.fn();
const listFlaggedCohorts = vi.fn();

vi.mock("../src/api/cohortMechanismApi", () => ({
  cohortMechanismApi: {
    listOverdueSessions: (...a: unknown[]) => listOverdueSessions(...a),
    listFlaggedCohorts: (...a: unknown[]) => listFlaggedCohorts(...a),
    escalateLevel1: vi.fn(),
    cancelWithMakeup: vi.fn(),
  },
}));

describe("EscalationQueueTab — Cohort cần xem xét đóng sớm (BR-14)", () => {
  it("Không có cohort nào bị đánh dấu → hiện Alert thành công", async () => {
    listOverdueSessions.mockResolvedValue({ data: { data: [] } });
    listFlaggedCohorts.mockResolvedValue({ data: { data: [] } });

    render(<EscalationQueueTab />);

    expect(
      await screen.findByText("Không có cohort nào cần xem xét đóng sớm.")
    ).toBeInTheDocument();
  });

  it("Có cohort bị đánh dấu → hiện bảng với tên lớp, giáo viên, thời điểm đánh dấu", async () => {
    listOverdueSessions.mockResolvedValue({ data: { data: [] } });
    listFlaggedCohorts.mockResolvedValue({
      data: {
        data: [
          {
            _id: "class-1",
            name: "Lớp Toán 10 - T1",
            code: "MATH10-T1",
            commitmentStatus: "ACTIVE",
            cancelledSessionsFlaggedAt: "2026-08-20T10:00:00.000Z",
            teacherId: { _id: "teacher-1", fullName: "Thầy Trần Văn Toán" },
          },
        ],
      },
    });

    render(<EscalationQueueTab />);

    expect(await screen.findByText("Lớp Toán 10 - T1")).toBeInTheDocument();
    expect(screen.getByText("Thầy Trần Văn Toán")).toBeInTheDocument();
    expect(screen.queryByText("Không có cohort nào cần xem xét đóng sớm.")).not.toBeInTheDocument();
  });

  it("teacherId chưa gán (null) → hiện 'Chưa có' thay vì lỗi render", async () => {
    listOverdueSessions.mockResolvedValue({ data: { data: [] } });
    listFlaggedCohorts.mockResolvedValue({
      data: {
        data: [
          {
            _id: "class-2",
            name: "Lớp chưa gán GV",
            commitmentStatus: "OFFERED",
            cancelledSessionsFlaggedAt: "2026-08-20T10:00:00.000Z",
            teacherId: null,
          },
        ],
      },
    });

    render(<EscalationQueueTab />);

    expect(await screen.findByText("Lớp chưa gán GV")).toBeInTheDocument();
    expect(screen.getByText("Chưa có")).toBeInTheDocument();
  });
});
