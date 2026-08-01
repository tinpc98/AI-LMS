// Chốt hành vi hiển thị tiến độ (sửa ở Wave 1.1).
//
// Đây là ĐẦU RA CUỐI CÙNG của chuỗi sửa lỗi P1: Backend tính tiến độ thật -> API map giữ
// null -> component này phải hiển thị "—" thay vì "0%".
//
// Nếu chỗ này hiển thị 0% khi chưa xác định được, thì toàn bộ công sức ở Backend và tầng
// API trở nên vô nghĩa: học sinh vẫn thấy một con số sai, chỉ khác là sai theo kiểu khác.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClassProgress } from "../src/features/class/components/classes/ClassProgress";

describe("ClassProgress", () => {
  it("hiển thị đúng phần trăm khi có số", () => {
    render(<ClassProgress percent={65} />);
    expect(screen.getByText("65%")).toBeInTheDocument();
  });

  it("0% là số THẬT — hiển thị '0%', không phải '—'", () => {
    render(<ClassProgress percent={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("null nghĩa là CHƯA XÁC ĐỊNH — hiển thị '—', không phải '0%'", () => {
    render(<ClassProgress percent={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("không truyền gì cũng coi là chưa xác định", () => {
    render(<ClassProgress />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("giá trị ngoài khoảng 0-100 bị kẹp lại, không hiển thị số vô lý", () => {
    const { unmount } = render(<ClassProgress percent={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    unmount();

    render(<ClassProgress percent={-20} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("trạng thái chưa xác định có chú thích giải thích lý do", () => {
    render(<ClassProgress percent={null} />);
    expect(screen.getByTitle(/chưa có bài giảng hoặc bài tập/i)).toBeInTheDocument();
  });
});
