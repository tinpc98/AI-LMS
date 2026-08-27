import axiosClient from "../../api/axiosClient";
import type { ApiResponse, ClassFilters, ClassFormValues, ClassRecord } from "./class.types";

const mapClass = (c: any): ClassRecord => {
  return {
    ...c,
    className: c.name || c.className,
    classCode: c.code || c.classCode,
    learningMode: c.mode ? (c.mode === "ONLINE" ? "Online" : "Offline") : c.learningMode,
    maxStudents: c.capacity || c.maxStudents,
    currentStudents: c.activeCount ?? 0,
    students: c.students || [],
    status: c.status,
    id: c._id || c.id,
    courseId: c.courseId?._id || c.courseId,
    courseName: c.courseId ? c.courseId.name : "",
    teacherId: c.teacherId?._id || c.teacherId,
    teacher: c.teacherId?._id ? { id: c.teacherId._id, fullName: c.teacherId.fullName } : null,
    assignedBy: c.assignedBy?._id || c.assignedBy,
  };
};

const mapPayload = (payload: ClassFormValues): any => {
  return {
    name: payload.className,
    code: payload.classCode,
    courseId:
      typeof payload.courseId === "object" ? (payload.courseId as any)._id : payload.courseId,
    level: payload.level,
    teacherId: payload.teacherId
      ? typeof payload.teacherId === "object"
        ? (payload.teacherId as any)._id
        : payload.teacherId
      : null,
    mode: payload.learningMode?.toUpperCase(),
    capacity: Number(payload.maxStudents),
    status: payload.status,
    classRoom: payload.classRoom,
    joinCode: payload.joinCode,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    schedule: payload.schedule,
    description: payload.description,
    note: payload.note,
    isEnrollmentOpen: payload.isEnrollmentOpen,
  };
};

export const classService = {
  async getClasses(filters: ClassFilters, isTrash = false): Promise<ApiResponse<ClassRecord[]>> {
    const params: Record<string, any> = { ...filters };
    if (params.learningMode === "All") delete params.learningMode;
    if (params.status === "All") delete params.status;

    const endpoint = isTrash ? "/classes/trash" : "/classes";
    const res = await axiosClient.get<ApiResponse<any[]>>(endpoint, { params });
    return {
      ...res.data,
      data: res.data.data.map(mapClass),
    };
  },

  async getCourseOptions() {
    // limit tối đa validatePagination cho phép là 100 (Backend/src/shared/middlewares/pagination.middleware.js)
    const res = await axiosClient.get("/courses", { params: { limit: 100 } });
    return res.data.data.map((c: any) => ({ id: c._id, label: c.name }));
  },

  async getTeacherOptions() {
    const res = await axiosClient.get("/users", { params: { role: "teacher", limit: 100 } });
    return res.data.data.map((u: any) => ({ id: u._id, label: u.fullName }));
  },

  async getClassById(id: string): Promise<ClassRecord> {
    const res = await axiosClient.get<ApiResponse<any>>(`/classes/${id}`);
    return mapClass(res.data.data);
  },

  async createClass(payload: ClassFormValues): Promise<ClassRecord> {
    const cleanPayload = mapPayload(payload);
    console.log("[classService] CREATE CLASS PAYLOAD", cleanPayload);
    const res = await axiosClient.post<ApiResponse<any>>("/classes", cleanPayload);
    return mapClass(res.data.data);
  },

  async updateClass(id: string, payload: ClassFormValues): Promise<ClassRecord> {
    const cleanPayload = mapPayload(payload);
    console.log("[classService] UPDATE CLASS PAYLOAD", cleanPayload);
    const res = await axiosClient.put<ApiResponse<any>>(`/classes/${id}`, cleanPayload);
    return mapClass(res.data.data);
  },

  async updateStatus(id: string, status: ClassRecord["status"]): Promise<ClassRecord> {
    const res = await axiosClient.put<ApiResponse<any>>(`/classes/${id}`, { status });
    return mapClass(res.data.data);
  },

  async deleteClass(id: string): Promise<void> {
    await axiosClient.patch(`/classes/${id}/delete`);
  },

  async restoreClass(id: string): Promise<void> {
    await axiosClient.patch(`/classes/${id}/restore`);
  },

  async permanentDeleteClass(id: string): Promise<void> {
    await axiosClient.delete(`/classes/${id}/force`);
  },
};
