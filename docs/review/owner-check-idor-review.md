# 🔍 Phân Tích Lỗ Hổng IDOR & Kiểm Tra Quyền Sở Hữu (Owner Check & IDOR Review)

**Dự án:** Hệ thống Quản lý Học tập AI (AI LMS)  
**Tác giả audit:** Principal Security Engineer & Senior Fullstack Architect  
**Ngày đánh giá:** 28/07/2026  

---

## 📑 Mục Lục
1. [Tổng Quan Quyền Sở Hữu Tài Nguyên (Owner Check Concept)](#1-tổng-quan-quyền-sở-hữu-tài-nguyên-owner-check-concept)
2. [Lỗ Hổng IDOR Chi Tiết Bài Nộp Bài Tập (Submission IDOR)](#2-lỗ-hổng-idor-chi-tiết-bài-nộp-bài-tập-submission-idor)
3. [Lỗ Hổng IDOR Chi Tiết Lượt Thi Trực Tuyến (ExamAttempt IDOR)](#3-lỗ-hổng-idor-chi-tiết-lượt-thi-trực-tuyến-examattempt-idor)
4. [Đánh Giá Quyền Quản Lý Lớp Học Của Giáo Viên (Teacher Class Ownership)](#4-đánh-giá-quyền-quản-lý-lớp-học-của-giáo-viên-teacher-class-ownership)
5. [Đề Xuất Mẫu Code Bổ Sung Owner Check Chuẩn Enterprise](#5-đề-xuất-mẫu-code-bổ-sung-owner-check-chuẩn-enterprise)

---

## 1. Tổng Quan Quyền Sở Hữu Tài Nguyên (Owner Check Concept)

Một hệ thống phân quyền hoàn chỉnh không chỉ dừng lại ở **RBAC (Role-Based Access Control)** mà bắt buộc phải tích hợp **ABAC (Attribute-Based Access Control) / Owner Check**.

- **Học sinh (Student):** Chỉ được xem/sửa các tài nguyên do chính mình tạo ra hoặc được đích danh gán quyền (Bài nộp của tôi, Kết quả thi của tôi, Lớp học tôi đã tham gia).
- **Giáo viên (Teacher):** Chỉ được quản lý các lớp học, bài tập, câu hỏi, đề thi do chính mình giảng dạy/sở hữu.

---

## 2. Lỗ Hổng IDOR Chi Tiết Bài Nộp Bài Tập (Submission IDOR)

### 🔴 PHÂN TÍCH CODE LỖ HỔNG:

Trong [assignment.controller.js](file:///e:/AI-LMS/Backend/src/controllers/assignment.controller.js):
```javascript
export const getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId).populate("studentId");
    
    // 🔴 THIẾU OWNER CHECK: Không kiểm tra submission.studentId có trùng với req.user.id!
    return res.status(200).json({ success: true, data: submission });
  } catch (e) {}
};
```

- **Rủi ro an ninh:** Học sinh A chỉ cần thay đổi giá trị `submissionId` trên thanh địa chỉ URL trình duyệt là có thể xem toàn bộ file bài làm, lời giải, ghi chú và điểm số của Học sinh B.

---

## 3. Lỗ Hổng IDOR Chi Tiết Lượt Thi Trực Tuyến (ExamAttempt IDOR)

Trong `examAttempt.controller.js`:
- Endpoint `GET /api/exam-attempts/:id` lấy chi tiết lượt thi bao gồm toàn bộ danh sách câu hỏi và các đáp án học sinh đã chọn.
- Controller thiếu câu lệnh kiểm tra:
  ```javascript
  if (attempt.studentId.toString() !== req.user.id && req.user.role !== "Teacher" && req.user.role !== "Admin") {
    return res.status(403).json({ message: "Bạn không có quyền xem kết quả bài thi này!" });
  }
  ```

---

## 4. Đánh Giá Quyền Quản Lý Lớp Học Của Giáo Viên (Teacher Class Ownership)

- ⭐ **Điểm Tốt:** `class.controller.js:updateClass` và `deleteClass` đã có kiểm tra:
  ```javascript
  const isOwner = String(classData.teacherId) === String(req.user.id);
  if (!isOwner && req.user.role !== "Admin") {
    return res.status(403).json({ message: "Bạn không có quyền sửa/xóa lớp học này!" });
  }
  ```
- ❌ **Điểm Thiếu:** API upload bài giảng (`Lesson`) hoặc tạo bài tập (`Assignment`) cho lớp chỉ kiểm tra `isTeacher` mà chưa đối chiếu giáo viên đó có phụ trách `classId` truyền vào hay không.

---

## 5. Đề Xuất Mẫu Code Bổ Sung Owner Check Chuẩn Enterprise

Để giải quyết triệt để rủi ro IDOR, khuyến nghị bổ sung helper kiểm tra quyền sở hữu tại Controller hoặc Middleware:

```javascript
export const validateOwnership = (resourceStudentId, reqUser) => {
  const userId = String(reqUser.id || reqUser._id);
  const userRole = String(reqUser.role || "").toLowerCase();

  if (userRole === "admin" || userRole === "teacher") return true;
  return String(resourceStudentId) === userId;
};
```
