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

    const response = await axiosClient.get("/courses", { params });
    return { ...response.data, data: response.data.data.map(mapCourse) };
  },

  async getCourseById(id: string): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.get(`/courses/${id}`);
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async createCourse(payload: CourseFormValues): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.post("/courses", payload);
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async updateCourse(id: string, payload: CourseFormValues): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.put(`/courses/${id}`, payload);
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async updateStatus(
    id: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  ): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.put(`/courses/${id}`, { status });
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async deleteCourse(id: string): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete(`/courses/${id}`);
    return response.data;
  },

  async getTrashCourses(filters: CourseFilters): Promise<ApiResponse<CourseRecord[]>> {
    const params: Record<string, any> = { ...filters };
    if (params.subject === "All") delete params.subject;
    if (params.status === "All") delete params.status;
    if (!params.search) delete params.search;

    const response = await axiosClient.get("/courses/trash", { params });
    return { ...response.data, data: response.data.data.map(mapCourse) };
  },

  async restoreCourse(id: string): Promise<ApiResponse<CourseRecord>> {
    const response = await axiosClient.patch(`/courses/${id}/restore`);
    return { ...response.data, data: mapCourse(response.data.data) };
  },

  async permanentDeleteCourse(id: string): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete(`/courses/${id}/force`);
    return response.data;
  },
};
