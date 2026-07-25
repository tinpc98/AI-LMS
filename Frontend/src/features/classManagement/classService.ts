import type { ClassFilters, ClassFormValues, ClassRecord } from "./class.types";
import { mockClasses } from "./mockClasses";
import { mockCourses } from "../courseManagement/course.mock";
import { mockUsers } from "../accountManagement/account.mock";

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const normalizeText = (value: string) => value.trim().toLowerCase();

export const classService = {
  async getClasses(filters: ClassFilters): Promise<ClassRecord[]> {
    await delay(500);

    return mockClasses.filter((item) => {
      const matchesSearch =
        !filters.search ||
        [item.className, item.classCode, item.joinCode, item.classroom].some((value) =>
          normalizeText(value).includes(normalizeText(filters.search)),
        );

      const matchesCourse = !filters.courseId || item.courseId === filters.courseId;
      const matchesLearningMode = filters.learningMode === "All" || item.learningMode === filters.learningMode;
      const matchesStatus = filters.status === "All" || item.status === filters.status;

      return matchesSearch && matchesCourse && matchesLearningMode && matchesStatus;
    });
  },

  async getCourseOptions() {
    await delay(200);
    return mockCourses.map((course) => ({ id: course.id, label: course.courseName }));
  },

  async getTeacherOptions() {
    await delay(200);
    return mockUsers
      .filter((user) => user.role === "Teacher")
      .map((user) => ({ id: user.id, label: user.fullName }));
  },

  async getClassById(id: string): Promise<ClassRecord | undefined> {
    await delay(300);
    return mockClasses.find((item) => item.id === id);
  },

  async createClass(payload: ClassFormValues): Promise<ClassRecord> {
    await delay(400);
    const newClass: ClassRecord = {
      id: `class-${Date.now()}`,
      className: payload.className.trim(),
      classCode: payload.classCode.trim(),
      courseId: payload.courseId,
      teacherId: payload.teacherId || null,
      joinCode: payload.joinCode.trim(),
      classroom: payload.classroom.trim(),
      learningMode: payload.learningMode,
      startDate: payload.startDate,
      endDate: payload.endDate,
      schedule: payload.schedule,
      maxStudents: payload.maxStudents,
      currentStudents: 0,
      students: [],
      description: payload.description.trim(),
      note: payload.note.trim(),
      isEnrollmentOpen: payload.isEnrollmentOpen,
      status: payload.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockClasses.unshift(newClass);
    return newClass;
  },

  async updateClass(id: string, payload: ClassFormValues): Promise<ClassRecord> {
    await delay(400);
    const index = mockClasses.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Class not found");

    const updated: ClassRecord = {
      ...mockClasses[index],
      className: payload.className.trim(),
      classCode: payload.classCode.trim(),
      courseId: payload.courseId,
      teacherId: payload.teacherId || null,
      joinCode: payload.joinCode.trim(),
      classroom: payload.classroom.trim(),
      learningMode: payload.learningMode,
      startDate: payload.startDate,
      endDate: payload.endDate,
      schedule: payload.schedule,
      maxStudents: payload.maxStudents,
      description: payload.description.trim(),
      note: payload.note.trim(),
      isEnrollmentOpen: payload.isEnrollmentOpen,
      status: payload.status,
      updatedAt: new Date().toISOString(),
    };

    mockClasses[index] = updated;
    return updated;
  },

  async updateStatus(id: string, status: ClassRecord["status"]): Promise<ClassRecord> {
    await delay(300);
    const index = mockClasses.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Class not found");

    const updated = { ...mockClasses[index], status, updatedAt: new Date().toISOString() };
    mockClasses[index] = updated;
    return updated;
  },

  async deleteClass(id: string): Promise<void> {
    await delay(300);
    const index = mockClasses.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Class not found");

    mockClasses.splice(index, 1);
  },
};
