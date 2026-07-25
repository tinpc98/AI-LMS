import type { CourseFilters, CourseFormValues, CourseRecord } from "./course.types";
import { mockCourses } from "./course.mock";

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const normalizeText = (value: string) => value.trim().toLowerCase();

export const courseService = {
  async getCourses(filters: CourseFilters): Promise<CourseRecord[]> {
    await delay(500);

    return mockCourses.filter((course) => {
      const matchesSearch =
        !filters.search ||
        [course.courseName, course.subject, course.target].some((value) =>
          normalizeText(value).includes(normalizeText(filters.search)),
        );

      const matchesSubject = filters.subject === "All" || course.subject === filters.subject;
      const matchesStatus = filters.status === "All" || course.status === filters.status;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  },

  async getCourseById(id: string): Promise<CourseRecord | undefined> {
    await delay(300);
    return mockCourses.find((course) => course.id === id);
  },

  async createCourse(payload: CourseFormValues): Promise<CourseRecord> {
    await delay(400);
    const newCourse: CourseRecord = {
      id: `c${Date.now()}`,
      courseName: payload.courseName.trim(),
      subject: payload.subject,
      grade: payload.grade,
      description: payload.description.trim(),
      thumbnail: payload.thumbnail.trim(),
      tuitionFee: payload.tuitionFee,
      durationWeeks: payload.durationWeeks,
      totalLessons: payload.totalLessons,
      target: payload.target.trim(),
      status: payload.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCourses.unshift(newCourse);
    return newCourse;
  },

  async updateCourse(id: string, payload: CourseFormValues): Promise<CourseRecord> {
    await delay(400);
    const index = mockCourses.findIndex((course) => course.id === id);
    if (index === -1) throw new Error("Course not found");

    const updated: CourseRecord = {
      ...mockCourses[index],
      courseName: payload.courseName.trim(),
      subject: payload.subject,
      grade: payload.grade,
      description: payload.description.trim(),
      thumbnail: payload.thumbnail.trim(),
      tuitionFee: payload.tuitionFee,
      durationWeeks: payload.durationWeeks,
      totalLessons: payload.totalLessons,
      target: payload.target.trim(),
      status: payload.status,
      updatedAt: new Date().toISOString(),
    };

    mockCourses[index] = updated;
    return updated;
  },

  async updateStatus(id: string, status: "Draft" | "Published" | "Closed"): Promise<CourseRecord> {
    await delay(300);
    const index = mockCourses.findIndex((course) => course.id === id);
    if (index === -1) throw new Error("Course not found");

    const updated = { ...mockCourses[index], status, updatedAt: new Date().toISOString() };
    mockCourses[index] = updated;
    return updated;
  },

  async deleteCourse(id: string): Promise<void> {
    await delay(300);
    const index = mockCourses.findIndex((course) => course.id === id);
    if (index === -1) throw new Error("Course not found");

    mockCourses.splice(index, 1);
  },
};
