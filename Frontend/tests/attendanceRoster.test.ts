// Chốt việc ghép danh sách học sinh với bản ghi điểm danh đã lưu.
//
// Đây là chỗ hậu quả nặng nhất trong đợt này: nếu so khớp id trượt, bảng sẽ hiện "Có mặt"
// mặc định cho tất cả, giáo viên bấm Lưu và GHI ĐÈ SẠCH dữ liệu điểm danh cũ mà không hay
// biết. Trước Wave 5 đoạn này nằm trong AttendancePopup và chưa có test nào.
import { describe, it, expect } from "vitest";
import { buildAttendanceRoster, DEFAULT_STATUS } from "../src/features/attendance/attendanceRoster";

describe("buildAttendanceRoster — chuẩn hoá id", () => {
  it("khớp khi CẢ HAI phía đều là chuỗi", () => {
    const kq = buildAttendanceRoster(
      [{ studentId: "hs1", fullName: "An" }],
      [{ studentId: "hs1", status: "Absent", note: "ốm" }]
    );
    expect(kq[0]).toMatchObject({ studentId: "hs1", status: "Absent", note: "ốm" });
  });

  it("khớp khi học sinh đã populate còn bản ghi là chuỗi", () => {
    const kq = buildAttendanceRoster(
      [{ studentId: { _id: "hs1", fullName: "An", email: "an@lms.vn" } }],
      [{ studentId: "hs1", status: "Late" }]
    );
    expect(kq[0]).toMatchObject({ studentId: "hs1", fullName: "An", status: "Late" });
  });

  it("khớp khi bản ghi đã populate còn học sinh là chuỗi", () => {
    // Chiều ngược lại. Cùng một API trả cả hai dạng tuỳ đường đi, nên phải chịu được cả hai.
    const kq = buildAttendanceRoster(
      [{ studentId: "hs1", fullName: "An" }],
      [{ studentId: { _id: "hs1" }, status: "Excused" }]
    );
    expect(kq[0].status).toBe("Excused");
  });

  it("khớp khi cả hai phía đều đã populate", () => {
    const kq = buildAttendanceRoster(
      [{ studentId: { _id: "hs1", fullName: "An" } }],
      [{ studentId: { _id: "hs1" }, status: "Absent" }]
    );
    expect(kq[0].status).toBe("Absent");
  });

  it("dùng _id của chính phần tử khi không có studentId", () => {
    const kq = buildAttendanceRoster(
      [{ _id: "hs1", fullName: "An" }],
      [{ studentId: "hs1", status: "Late" }]
    );
    expect(kq[0]).toMatchObject({ studentId: "hs1", status: "Late" });
  });
});

describe("buildAttendanceRoster — mặc định và trường hợp biên", () => {
  it("học sinh chưa có bản ghi thì mặc định Có mặt, ghi chú rỗng", () => {
    const kq = buildAttendanceRoster([{ studentId: "hs1", fullName: "An" }], []);
    expect(kq[0]).toMatchObject({ status: DEFAULT_STATUS, note: "" });
  });

  it("KHÔNG lấy nhầm bản ghi của học sinh khác", () => {
    const kq = buildAttendanceRoster(
      [
        { studentId: "hs1", fullName: "An" },
        { studentId: "hs2", fullName: "Bình" },
      ],
      [{ studentId: "hs2", status: "Absent", note: "nghỉ" }]
    );
    expect(kq[0].status).toBe(DEFAULT_STATUS); // An chưa có bản ghi
    expect(kq[1]).toMatchObject({ status: "Absent", note: "nghỉ" });
  });

  it("thiếu tên/email thì dùng giá trị thay thế, không hiện undefined", () => {
    const kq = buildAttendanceRoster([{ studentId: "hs1" }], []);
    expect(kq[0].fullName).toBe("Học sinh");
    expect(kq[0].email).toBe("");
  });

  it("giữ nguyên số lượng và thứ tự học sinh của lớp", () => {
    const kq = buildAttendanceRoster(
      [{ studentId: "c" }, { studentId: "a" }, { studentId: "b" }],
      [{ studentId: "a", status: "Late" }]
    );
    expect(kq.map((r) => r.studentId)).toEqual(["c", "a", "b"]);
  });

  it("lớp chưa có học sinh thì trả mảng rỗng", () => {
    expect(buildAttendanceRoster([], [{ studentId: "hs1", status: "Absent" }])).toEqual([]);
  });

  it("bản ghi thiếu studentId không làm sập, cũng không khớp bừa", () => {
    const kq = buildAttendanceRoster([{ studentId: "hs1" }], [{ status: "Absent" }]);
    expect(kq[0].status).toBe(DEFAULT_STATUS);
  });
});
