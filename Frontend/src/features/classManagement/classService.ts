import axiosClient from "../../api/axiosClient";
import type { ApiResponse, ClassFilters, ClassFormValues, ClassRecord } from "./class.types";
import { mockCourses } from "../courseManagement/course.mock";
import { mockUsers } from "../accountManagement/account.mock";

const mapClass = (c: any): ClassRecord => {
  return {
    ...c,
    id: c._id,
    courseId: c.courseId?._id || c.courseId,
    teacherId: c.teacherId?._id || c.teacherId,
    teacher: c.teacherId?._id ? { id: c.teacherId._id, fullName: c.teacherId.fullName } : null,
    assignedBy: c.assignedBy?._id || c.assignedBy,
  };
};

export const classService = {
  async getClasses(filters: ClassFilters, isTrash = false): Promise<ApiResponse<ClassRecord[]>> {
    const params: Record<string, any> = { ...filters };
    if (params.learningMode === "All") delete params.learningMode;
    if (params.status === "All") delete params.status;
    
    const endpoint = isTrash ? "/api/classes/trash" : "/api/classes";
    const res = await axiosClient.get<ApiResponse<any[]>>(endpoint, { params });
    return {
      ...res.data,
      data: res.data.data.map(mapClass),
    };
  },

  async getCourseOptions() {
    // Optional: fetch real courses if needed. For now, keep mock or use real courseService.
    try {
      const res = await axiosClient.get("/api/courses", { params: { limit: 1000 } });
      return res.data.data.map((c: any) => ({ id: c._id, label: c.courseName }));
    } catch {
      return mockCourses.map((course) => ({ id: course.id, label: course.courseName }));
    }
  },

  async getTeacherOptions() {
    // Optional: fetch real teachers if needed.
    try {
      const res = await axiosClient.get("/api/users", { params: { role: "teacher", limit: 1000 } });
      return res.data.data.map((u: any) => ({ id: u._id, label: u.fullName }));
    } catch {
      return mockUsers
        .filter((user) => user.role === "Teacher")
        .map((user) => ({ id: user.id, label: user.fullName }));
    }
  },

  async getClassById(id: string): Promise<ClassRecord> {
    const res = await axiosClient.get<ApiResponse<any>>(`/api/classes/${id}`);
    return mapClass(res.data.data);
  },

  async createClass(payload: ClassFormValues): Promise<ClassRecord> {
    const res = await axiosClient.post<ApiResponse<any>>("/api/classes", payload);
    return mapClass(res.data.data);
  },

  async updateClass(id: string, payload: ClassFormValues): Promise<ClassRecord> {
    const res = await axiosClient.put<ApiResponse<any>>(`/api/classes/${id}`, payload);
    return mapClass(res.data.data);
  },

  async updateStatus(id: string, status: ClassRecord["status"]): Promise<ClassRecord> {
    const res = await axiosClient.put<ApiResponse<any>>(`/api/classes/${id}`, { status });
    return mapClass(res.data.data);
  },

  async deleteClass(id: string): Promise<void> {
    await axiosClient.patch(`/api/classes/${id}/delete`);
  },

  async restoreClass(id: string): Promise<void> {
    await axiosClient.patch(`/api/classes/${id}/restore`);
  },

  async permanentDeleteClass(id: string): Promise<void> {
    await axiosClient.delete(`/api/classes/${id}/force`);
  },
};
