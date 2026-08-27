// Nút "Đánh giá lớp học" chỉ được hiện khi commitmentStatus của lớp đã COMPLETED/
// COMPLETED_PARTIAL (EduSpace mechanism design Phần C.3, BR-25). Đây là điều kiện duy nhất
// quyết định học sinh có được đánh giá hay không, nên phải chốt hành vi này bằng test thay vì
// chỉ đọc lại code.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClassCardActions } from "../src/features/class/components/classes/ClassCardActions";
import type { IStudentClass, CommitmentStatus } from "../src/types/studentClass";

const baseItem: IStudentClass = {
  _id: "class-1",
  name: "Lớp Toán 12",
  status: "Active",
  mode: "ONLINE",
};

const withCommitmentStatus = (commitmentStatus?: CommitmentStatus): IStudentClass => ({
  ...baseItem,
  commitmentStatus,
});

const renderActions = (item: IStudentClass) =>
  render(
    <MemoryRouter>
      <ClassCardActions item={item} />
    </MemoryRouter>
  );

describe("ClassCardActions - nút đánh giá lớp học (CohortFeedback)", () => {
  it("KHÔNG hiện nút khi chưa có commitmentStatus", () => {
    renderActions(withCommitmentStatus(undefined));
    expect(screen.queryByText("Đánh giá lớp học")).not.toBeInTheDocument();
  });

  it("KHÔNG hiện nút khi commitmentStatus còn đang ACTIVE (lớp chưa kết thúc)", () => {
    renderActions(withCommitmentStatus("ACTIVE"));
    expect(screen.queryByText("Đánh giá lớp học")).not.toBeInTheDocument();
  });

  it("KHÔNG hiện nút khi commitmentStatus là OFFERED (mặc định của lớp cũ chưa qua cơ chế mới)", () => {
    renderActions(withCommitmentStatus("OFFERED"));
    expect(screen.queryByText("Đánh giá lớp học")).not.toBeInTheDocument();
  });

  it("HIỆN nút khi commitmentStatus là COMPLETED", () => {
    renderActions(withCommitmentStatus("COMPLETED"));
    expect(screen.getByText("Đánh giá lớp học")).toBeInTheDocument();
  });

  it("HIỆN nút khi commitmentStatus là COMPLETED_PARTIAL (đóng sớm nhưng đủ tiến độ)", () => {
    renderActions(withCommitmentStatus("COMPLETED_PARTIAL"));
    expect(screen.getByText("Đánh giá lớp học")).toBeInTheDocument();
  });

  it("KHÔNG hiện nút khi commitmentStatus là TERMINATED", () => {
    renderActions(withCommitmentStatus("TERMINATED"));
    expect(screen.queryByText("Đánh giá lớp học")).not.toBeInTheDocument();
  });
});
