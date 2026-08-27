// Test cho announcement.service.js — chốt 3 lỗ hổng bảo mật thật đã tìm và sửa trong đợt review
// toàn dự án: (1) IDOR ở getAnnouncements khi truyền classId bất kỳ, (2) getAnnouncementById
// không kiểm quyền gì cả, (3) updateAnnouncement cho phép leo thang phạm vi (scope/classId).
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const announcementFind = vi.fn();
const announcementCountDocuments = vi.fn();
const announcementFindById = vi.fn();
const classFindById = vi.fn();
const classFind = vi.fn();
const classExists = vi.fn();
const enrollmentFind = vi.fn();
const enrollmentExists = vi.fn();

vi.mock("#modules/announcement/announcement.model.js", () => ({
  default: {
    find: (...a) => announcementFind(...a),
    countDocuments: (...a) => announcementCountDocuments(...a),
    findById: (...a) => announcementFindById(...a),
  },
}));
vi.mock("#modules/class", () => ({
  Class: {
    findById: (...a) => classFindById(...a),
    find: (...a) => classFind(...a),
    exists: (...a) => classExists(...a),
  },
}));
vi.mock("#modules/classEnrollment", () => ({
  ClassEnrollment: {
    find: (...a) => enrollmentFind(...a),
    exists: (...a) => enrollmentExists(...a),
  },
}));

const { default: announcementService } =
  await import("#modules/announcement/announcement.service.js");

const STUDENT_ID = new mongoose.Types.ObjectId().toString();
const TEACHER_ID = new mongoose.Types.ObjectId().toString();
const MY_CLASS_ID = new mongoose.Types.ObjectId().toString();
const OTHER_CLASS_ID = new mongoose.Types.ObjectId().toString();
const ANNOUNCEMENT_ID = new mongoose.Types.ObjectId().toString();

const mongooseSelectLean = (result) => ({
  select: () => ({ lean: () => Promise.resolve(result) }),
});

beforeEach(() => {
  vi.clearAllMocks();
  announcementFind.mockReturnValue({
    populate: () => ({
      populate: () => ({
        populate: () => ({
          sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }) }),
        }),
      }),
    }),
  });
  announcementCountDocuments.mockResolvedValue(0);
});

describe("getAnnouncements — BUG ĐÃ SỬA (IDOR): classId truyền vào PHẢI giao với lớp thật của người gọi", () => {
  it("Học sinh truyền classId của LỚP MÌNH ĐÃ GHI DANH → query lọc đúng lớp đó", async () => {
    enrollmentFind.mockReturnValue(mongooseSelectLean([{ classId: MY_CLASS_ID }]));

    await announcementService.getAnnouncements({
      classId: MY_CLASS_ID,
      userId: STUDENT_ID,
      userRole: "student",
    });

    const filter = announcementFind.mock.calls[0][0];
    expect(String(filter.classId)).toBe(MY_CLASS_ID);
    expect(filter.scope).toBe("Class");
  });

  it("Học sinh truyền classId của LỚP KHÔNG THUỘC MÌNH → trả về rỗng (sentinel không khớp), KHÔNG lộ dữ liệu", async () => {
    enrollmentFind.mockReturnValue(mongooseSelectLean([{ classId: MY_CLASS_ID }]));

    await announcementService.getAnnouncements({
      classId: OTHER_CLASS_ID,
      userId: STUDENT_ID,
      userRole: "student",
    });

    const filter = announcementFind.mock.calls[0][0];
    // Không được set filter.classId = OTHER_CLASS_ID (đó chính là lỗi cũ).
    expect(filter.classId).toBeUndefined();
    expect(filter._id).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  it("Học sinh KHÔNG truyền classId → lọc theo đúng danh sách lớp đã ghi danh (hành vi cũ vẫn giữ)", async () => {
    enrollmentFind.mockReturnValue(mongooseSelectLean([{ classId: MY_CLASS_ID }]));

    await announcementService.getAnnouncements({ userId: STUDENT_ID, userRole: "student" });

    const filter = announcementFind.mock.calls[0][0];
    expect(filter.$or).toEqual([
      { scope: "System" },
      { scope: "Class", classId: { $in: [MY_CLASS_ID] } },
    ]);
  });

  it("Giáo viên truyền classId của lớp KHÔNG dạy → trả về rỗng", async () => {
    classFind.mockReturnValue({
      select: () => ({ lean: () => Promise.resolve([{ _id: MY_CLASS_ID }]) }),
    });

    await announcementService.getAnnouncements({
      classId: OTHER_CLASS_ID,
      userId: TEACHER_ID,
      userRole: "teacher",
    });

    const filter = announcementFind.mock.calls[0][0];
    expect(filter.classId).toBeUndefined();
    expect(filter._id).toBeInstanceOf(mongoose.Types.ObjectId);
  });
});

describe("getAnnouncementById — BUG ĐÃ SỬA: trước đây không kiểm quyền gì cả", () => {
  const mockAnnouncement = (over = {}) => ({
    _id: ANNOUNCEMENT_ID,
    scope: "Class",
    classId: { _id: MY_CLASS_ID },
    createdBy: { _id: TEACHER_ID },
    ...over,
  });

  const mockFindByIdChain = (result) => ({
    populate: () => ({
      populate: () => ({ populate: () => ({ lean: () => Promise.resolve(result) }) }),
    }),
  });

  it("Học sinh CHƯA ghi danh lớp của thông báo → 403", async () => {
    announcementFindById.mockReturnValue(mockFindByIdChain(mockAnnouncement()));
    enrollmentExists.mockResolvedValue(null);

    await expect(
      announcementService.getAnnouncementById(ANNOUNCEMENT_ID, STUDENT_ID, "student")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Học sinh ĐÃ ghi danh lớp của thông báo → xem được", async () => {
    announcementFindById.mockReturnValue(mockFindByIdChain(mockAnnouncement()));
    enrollmentExists.mockResolvedValue(true);

    const result = await announcementService.getAnnouncementById(
      ANNOUNCEMENT_ID,
      STUDENT_ID,
      "student"
    );
    expect(result).toBeDefined();
  });

  it("Thông báo scope=System → ai đăng nhập cũng xem được, không cần kiểm lớp", async () => {
    announcementFindById.mockReturnValue(
      mockFindByIdChain(mockAnnouncement({ scope: "System", classId: null }))
    );

    const result = await announcementService.getAnnouncementById(
      ANNOUNCEMENT_ID,
      STUDENT_ID,
      "student"
    );
    expect(result).toBeDefined();
    expect(enrollmentExists).not.toHaveBeenCalled();
  });

  it("Giáo viên không dạy lớp và không phải người tạo → 403", async () => {
    announcementFindById.mockReturnValue(mockFindByIdChain(mockAnnouncement()));
    classExists.mockResolvedValue(false);

    await expect(
      announcementService.getAnnouncementById(ANNOUNCEMENT_ID, "another-teacher", "teacher")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Admin luôn xem được, không kiểm gì thêm", async () => {
    announcementFindById.mockReturnValue(mockFindByIdChain(mockAnnouncement()));

    const result = await announcementService.getAnnouncementById(
      ANNOUNCEMENT_ID,
      "admin-1",
      "admin"
    );
    expect(result).toBeDefined();
    expect(enrollmentExists).not.toHaveBeenCalled();
  });
});

describe("updateAnnouncement — BUG ĐÃ SỬA: chặn leo thang scope/classId", () => {
  const mockOwnedAnnouncement = (over = {}) => ({
    _id: ANNOUNCEMENT_ID,
    scope: "Class",
    classId: MY_CLASS_ID,
    createdBy: { toString: () => TEACHER_ID },
    save: vi.fn().mockResolvedValue(true),
    ...over,
  });

  it("Giáo viên sở hữu thông báo cố đổi scope thành System → bị chặn", async () => {
    announcementFindById.mockResolvedValue(mockOwnedAnnouncement());

    await expect(
      announcementService.updateAnnouncement(
        ANNOUNCEMENT_ID,
        { scope: "System" },
        TEACHER_ID,
        "teacher"
      )
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Giáo viên cố đổi classId sang lớp mình KHÔNG dạy → bị chặn", async () => {
    announcementFindById.mockResolvedValue(mockOwnedAnnouncement());
    classFindById.mockResolvedValue({ teacherId: { toString: () => "khac-giao-vien" } });

    await expect(
      announcementService.updateAnnouncement(
        ANNOUNCEMENT_ID,
        { classId: OTHER_CLASS_ID },
        TEACHER_ID,
        "teacher"
      )
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Giáo viên chỉ sửa title/content (không đụng scope/classId) → không bị kiểm lại quyền lớp, vẫn lưu bình thường", async () => {
    const announcement = mockOwnedAnnouncement();
    announcementFindById.mockResolvedValue(announcement);

    await announcementService.updateAnnouncement(
      ANNOUNCEMENT_ID,
      { title: "Tiêu đề mới" },
      TEACHER_ID,
      "teacher"
    );

    expect(classFindById).not.toHaveBeenCalled();
    expect(announcement.title).toBe("Tiêu đề mới");
    expect(announcement.save).toHaveBeenCalled();
  });

  it("Admin đổi scope thành System → được phép", async () => {
    const announcement = mockOwnedAnnouncement({ createdBy: { toString: () => "someone-else" } });
    announcementFindById.mockResolvedValue(announcement);

    await announcementService.updateAnnouncement(
      ANNOUNCEMENT_ID,
      { scope: "System" },
      "admin-1",
      "admin"
    );

    expect(announcement.scope).toBe("System");
  });
});
