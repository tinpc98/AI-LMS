// Trang trạng thái xác minh có 2 nhánh loại trừ nhau: chưa L3 thì thấy checklist điều kiện lên
// L3, đã L3 thì thấy khu vực "Bảo lãnh đồng nghiệp" — không có lớp nào thật trong DB dev đang ở
// L3 để bấm thử qua trình duyệt, nên chốt hành vi rẽ nhánh này bằng test mock trực tiếp API.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { VerificationStatusPage } from "../src/features/verification/pages/VerificationStatusPage";

const getMyStatus = vi.fn();
const getMyCoTaughtColleagues = vi.fn();
const vouchForTeacher = vi.fn();

vi.mock("../src/api/verificationApi", () => ({
  verificationApi: {
    getMyStatus: (...a: unknown[]) => getMyStatus(...a),
    getMyCoTaughtColleagues: (...a: unknown[]) => getMyCoTaughtColleagues(...a),
    vouchForTeacher: (...a: unknown[]) => vouchForTeacher(...a),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VerificationStatusPage", () => {
  it("Chưa L3: hiện checklist điều kiện, KHÔNG hiện khu vực bảo lãnh", async () => {
    getMyStatus.mockResolvedValue({
      data: {
        data: {
          verificationTier: "L1",
          reliabilityScore: 100,
          poolStatus: "ACTIVE",
          poolLockedUntil: null,
          vouchLimit: 2,
          vouchedByCount: 0,
          vouchSuspendedUntil: null,
          l3Eligibility: {
            eligible: false,
            completedCommunityCohorts: 0,
            requiredCohorts: 2,
            notRemovedFromPool: true,
            hasAtLeastOneVoucher: false,
          },
        },
      },
    });

    render(<VerificationStatusPage />);

    expect(await screen.findByText("Điều kiện lên L3")).toBeInTheDocument();
    expect(screen.queryByText("Bảo lãnh đồng nghiệp lên L3")).not.toBeInTheDocument();
    expect(getMyCoTaughtColleagues).not.toHaveBeenCalled();
  });

  it("Đã L3: KHÔNG hiện checklist, HIỆN khu vực bảo lãnh với danh sách đồng nghiệp thật", async () => {
    getMyStatus.mockResolvedValue({
      data: {
        data: {
          verificationTier: "L3",
          reliabilityScore: 95,
          poolStatus: "ACTIVE",
          poolLockedUntil: null,
          vouchLimit: 1,
          vouchedByCount: 1,
          vouchSuspendedUntil: null,
          l3Eligibility: null,
        },
      },
    });
    getMyCoTaughtColleagues.mockResolvedValue({
      data: { data: [{ id: "colleague-1", fullName: "Cô Lan" }] },
    });

    render(<VerificationStatusPage />);

    expect(await screen.findByText("Bảo lãnh đồng nghiệp lên L3")).toBeInTheDocument();
    expect(screen.queryByText("Điều kiện lên L3")).not.toBeInTheDocument();
    await waitFor(() => expect(getMyCoTaughtColleagues).toHaveBeenCalled());
  });

  it("Đã L3 nhưng đang bị tạm khoá quyền bảo lãnh: hiện cảnh báo, KHÔNG hiện form chọn đồng nghiệp", async () => {
    const future = new Date(Date.now() + 999999999).toISOString();
    getMyStatus.mockResolvedValue({
      data: {
        data: {
          verificationTier: "L3",
          reliabilityScore: 95,
          poolStatus: "ACTIVE",
          poolLockedUntil: null,
          vouchLimit: 2,
          vouchedByCount: 1,
          vouchSuspendedUntil: future,
          l3Eligibility: null,
        },
      },
    });
    getMyCoTaughtColleagues.mockResolvedValue({ data: { data: [] } });

    render(<VerificationStatusPage />);

    expect(await screen.findByText(/tạm khoá tới/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Chọn đồng nghiệp/i)).not.toBeInTheDocument();
  });
});
