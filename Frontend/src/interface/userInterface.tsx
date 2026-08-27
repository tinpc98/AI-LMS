export type DayOfWeek =
  "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface DayAvailability {
  startTime: string;
  endTime: string;
  available: boolean;
}

export type AvailabilitySchedule = Partial<Record<DayOfWeek, DayAvailability>>;

export default interface User {
  id?: string;
  _id?: string;
  name?: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: "student" | "teacher" | "admin" | "Student" | "Teacher" | "Admin";
  status?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  terms?: boolean;
  // Chỉ có ý nghĩa với role Teacher — xem Backend/src/modules/auth/user.model.js
  teachingSubjects?: string[];
  availabilitySchedule?: AvailabilitySchedule | null;
}
