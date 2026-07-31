import axiosClient from "./axiosClient";

export interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
  createdBy?: any;
  scope: "System" | "Course" | "Class" | string;
  classId?: string;
  courseId?: string;
  attachments?: Array<{
    name: string;
    url: string;
    publicId: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export const announcementApi = {
  // Lấy danh sách thông báo theo Lớp học
  getAnnouncementsByClass: async (classId: string, search?: string): Promise<IAnnouncement[]> => {
    const params: Record<string, string> = { scope: "Class", classId };
    if (search) params.search = search;

    const response = await axiosClient.get<{ data: IAnnouncement[]; items?: IAnnouncement[] }>(
      "/api/announcements",
      {
        params,
      }
    );
    return response.data.data || response.data.items || response.data || [];
  },

  // Lấy chi tiết 1 thông báo
  getAnnouncementById: async (id: string): Promise<IAnnouncement> => {
    const response = await axiosClient.get<{ data: IAnnouncement }>(`/api/announcements/${id}`);
    return response.data.data || response.data;
  },

  // Tạo thông báo mới cho lớp học
  createAnnouncement: async (data: {
    title: string;
    content: string;
    classId: string;
    scope?: string;
  }): Promise<IAnnouncement> => {
    const payload = {
      ...data,
      scope: data.scope || "Class",
    };
    const response = await axiosClient.post<{ data: IAnnouncement }>("/api/announcements", payload);
    return response.data.data || response.data;
  },

  // Cập nhật thông báo
  updateAnnouncement: async (
    id: string,
    data: { title?: string; content?: string }
  ): Promise<IAnnouncement> => {
    const response = await axiosClient.put<{ data: IAnnouncement }>(
      `/api/announcements/${id}`,
      data
    );
    return response.data.data || response.data;
  },

  // Xóa thông báo
  deleteAnnouncement: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/announcements/${id}`);
  },
};

export default announcementApi;
