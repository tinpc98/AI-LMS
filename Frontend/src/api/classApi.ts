import axiosClient from "./axiosClient";

export interface ResourceAccessData {
  signedUrl: string | null;
  expiresAt: string | null;
  isExternal: boolean;
}

export interface UploadResourceResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    title: string;
    type: string;
    publicId?: string;
    storageType?: string;
    resourceType?: string;
    format?: string;
    bytes?: number;
    originalFilename?: string;
  };
  storageUsed: number;
  storageLimit: number;
  warning?: string;
}

export const classApi = {
  // Lấy danh sách lớp do Giáo viên phụ trách hoặc học sinh tham gia
  getMyClasses: () => axiosClient.get("/api/classes"),

  // Lấy chi tiết lớp học theo ID
  getClassById: (id: string) => axiosClient.get(`/api/classes/${id}`),

  // Thêm tài nguyên bằng cách dán URL (Giáo viên / Admin)
  addResource: (
    classId: string,
    resourceData: { title: string; description?: string; type?: string; url: string }
  ) => axiosClient.post(`/api/classes/${classId}/resources`, resourceData),

  /**
   * Upload file tài liệu lên Cloudinary qua backend.
   * @param classId  - ID lớp học
   * @param formData - FormData chứa field 'file', 'title', 'description', 'type'
   * @param onProgress - Callback % tiến trình (0–100)
   * @param signal   - AbortSignal để hủy giữa chừng
   */
  uploadResource: (
    classId: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ) =>
    axiosClient.post<UploadResourceResponse>(
      `/api/classes/${classId}/resources/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        signal,
        onUploadProgress: (evt) => {
          if (onProgress && evt.total) {
            onProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
      }
    ),

  /**
   * Lấy URL đã ký để truy cập tài liệu (cho PDF.js, DocxViewer...).
   * URL hết hạn sau 2 giờ. Frontend tự xin lại khi cần.
   */
  getResourceAccessUrl: (classId: string, resourceId: string) =>
    axiosClient.get<{ success: boolean; data: ResourceAccessData }>(
      `/api/classes/${classId}/resources/${resourceId}/access`
    ),

  // Xóa tài nguyên bài học khỏi lớp (Giáo viên / Admin)
  removeResource: (classId: string, resourceId: string) =>
    axiosClient.delete(`/api/classes/${classId}/resources/${resourceId}`),
};
