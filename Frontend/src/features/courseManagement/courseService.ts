import axiosClient from "../../api/axiosClient";
import type { ApiResponse, CourseFilters, CourseFormValues, CourseRecord } from "./course.types";

const mapCourse = (course: any): CourseRecord => ({
  ...course,
  id: course._id || course.id,
});

export const courseService = {
  async getCourses(filters: CourseFilters): Promise<ApiResponse<CourseRecord[]>> {
    const params: Record<string, any> = { ...filters };
    if (params.subject === "All") delete params.subject;
    if (params.status === "All") delete params.status;
    if (!params.search) delete params.search;

    const response = await axiosClient.get("/api/courses", { params });
    return { ...response.data, data: response.data.data.map(mapCourse) };
  },

  async getCourseById(id: string): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.get(`/api/courses/${id}`);
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async createCourse(payload: CourseFormValues): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.post("/api/courses", payload);
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async updateCourse(id: string, payload: CourseFormValues): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.put(`/api/courses/${id}`, payload);
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async updateStatus(id: string, status: "Draft" | "Published" | "Closed"): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.put(`/api/courses/${id}`, { status });
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async deleteCourse(id: string): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete(`/api/courses/${id}`);
    return response.data;
  },

  async getTrashCourses(filters: CourseFilters): Promise<ApiResponse<CourseRecord[]>> {
    const params: Record<string, any> = { ...filters };
    if (params.subject === "All") delete params.subject;
    if (params.status === "All") delete params.status;
    if (!params.search) delete params.search;

    const response = await axiosClient.get("/api/courses/trash", { params });
    return { ...response.data, data: response.data.data.map(mapCourse) };
  },

  async restoreCourse(id: string): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.patch(`/api/courses/${id}/restore`);
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async permanentDeleteCourse(id: string): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete(`/api/courses/${id}/force`);
    return response.data;
  }
};
