// Chốt việc form bài giảng khởi tạo ĐÚNG NGAY LẦN RENDER ĐẦU.
//
// Bản cũ luôn nằm trong cây React (tự trả về null khi đóng) nên state form sống sót qua các
// lần đóng/mở, và phải có một useEffect nạp lại 7 ô state mỗi khi isOpen bật lên. Hậu quả:
// bấm "Sửa" bài B ngay sau khi vừa xem bài A thì lượt render đầu tiên hiển thị nội dung của
// bài A. Với ô nhập liệu thì đây là lỗi nhìn thấy rất rõ.
//
// Cách sửa là gắn kết có điều kiện + key ở component cha, nên state khởi tạo thẳng từ props.
// Hai test đầu bám vào ĐÚNG hợp đồng đó: component chỉ được mount khi đang mở, và mỗi lần
// mount phải phản ánh lessonData tại thời điểm mount.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CreateLessonModal from "../src/features/lesson/components/CreateLessonModal";
import type { ILesson } from "../src/interface/lessonInterface";

vi.mock("../src/api/lessonApi", () => ({
  lessonApi: { createLesson: vi.fn(), updateLesson: vi.fn() },
}));

const lesson = (over: Partial<ILesson>): ILesson =>
  ({
    _id: "l1",
    title: "Bài 1 — Mệnh đề",
    description: "Mô tả bài 1",
    videoUrl: "https://youtu.be/aaa",
    duration: 45,
    isPublished: true,
    attachments: [], // Mongoose luôn trả mảng này; fixture phải trung thực với dữ liệu thật
    ...over,
  }) as ILesson;

const baseProps = {
  onClose: vi.fn(),
  classId: "c1",
  onCreated: vi.fn(),
  onUpdated: vi.fn(),
};

const titleInput = () => screen.getByPlaceholderText(/Chương 1/i) as HTMLInputElement;

describe("CreateLessonModal — khởi tạo form", () => {
  it("chế độ sửa: ô nhập mang nội dung bài giảng ngay lần render đầu", () => {
    render(<CreateLessonModal {...baseProps} lessonData={lesson({})} />);

    expect(titleInput().value).toBe("Bài 1 — Mệnh đề");
    expect(screen.getByDisplayValue("Mô tả bài 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://youtu.be/aaa")).toBeInTheDocument();
    expect(screen.getByText(/Sửa bài giảng/i)).toBeInTheDocument();
  });

  it("chế độ tạo mới: form rỗng, không dính dữ liệu bài nào", () => {
    render(<CreateLessonModal {...baseProps} lessonData={null} />);

    expect(titleInput().value).toBe("");
    expect(screen.getByText(/Tạo bài giảng mới/i)).toBeInTheDocument();
  });

  it("mount lại với key khác thì form mang bài MỚI, không sót bài cũ", () => {
    // Mô phỏng đúng cách component cha dùng: key theo _id. Đây là điều kiện then chốt khiến
    // bỏ được useEffect đồng bộ — remount thì state khởi tạo lại từ props.
    const { rerender } = render(
      <CreateLessonModal key="l1" {...baseProps} lessonData={lesson({})} />
    );
    expect(titleInput().value).toBe("Bài 1 — Mệnh đề");

    rerender(
      <CreateLessonModal
        key="l2"
        {...baseProps}
        lessonData={lesson({ _id: "l2", title: "Bài 2 — Tập hợp", description: "Mô tả bài 2" })}
      />
    );

    expect(titleInput().value).toBe("Bài 2 — Tập hợp");
    expect(screen.queryByDisplayValue("Mô tả bài 1")).not.toBeInTheDocument();
  });

  it("thiếu trường tuỳ chọn thì dùng giá trị mặc định, không hiện 'undefined'", () => {
    render(
      <CreateLessonModal
        {...baseProps}
        lessonData={lesson({ description: undefined, videoUrl: undefined, duration: undefined })}
      />
    );

    expect(titleInput().value).toBe("Bài 1 — Mệnh đề");
    expect(screen.queryByDisplayValue("undefined")).not.toBeInTheDocument();
  });
});
