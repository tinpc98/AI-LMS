export type CourseSubject = "Mathematics" | "Physics" | "Chemistry" | "English" | "Literature";
export type CourseStatus = "Draft" | "Published" | "Closed";

export interface CourseRecord {
  id: string;
  courseName: string;
  subject: CourseSubject;
  grade: number;
  description: string;
  thumbnail: string;
  tuitionFee: number;
  durationWeeks: number;
  totalLessons: number;
  target: string;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilters {
  search: string;
  subject: CourseSubject | "All";
  status: CourseStatus | "All";
}

export interface CourseFormValues {
  courseName: string;
  subject: CourseSubject;
  grade: number;
  description: string;
  thumbnail: string;
  tuitionFee: number;
  durationWeeks: number;
  totalLessons: number;
  target: string;
  status: CourseStatus;
}
