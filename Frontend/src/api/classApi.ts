import axiosClient from "./axiosClient";

export const classApi = {
  // Lấy danh sách lớp do Giáo viên phụ trách hoặc học sinh tham gia
  getMyClasses: () => axiosClient.get("/api/classes"),

  // Lấy chi tiết lớp học theo ID
  getClassById: (id: string) => axiosClient.get(`/api/classes/${id}`),

  // Thêm tài nguyên bài học vào lớp (Giáo viên / Admin)
  addResource: (
    classId: string,
    resourceData: { title: string; description?: string; type?: string; url: string }
  ) => axiosClient.post(`/api/classes/${classId}/resources`, resourceData),

  // Xóa tài nguyên bài học khỏi lớp (Giáo viên / Admin)
  removeResource: (classId: string, resourceId: string) =>
    axiosClient.delete(`/api/classes/${classId}/resources/${resourceId}`),
};
