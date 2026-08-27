import type { AvailabilitySchedule } from "../../interface/userInterface";

export type LearnerNeedStatus = "OPEN" | "MATCHED" | "CLOSED";
export type PreferredFormat = "ONLINE" | "OFFLINE" | "ANY";

export interface LearnerNeedStudentInfo {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface LearnerNeedRecord {
  _id: string;
  // Chuỗi id trong response "của tôi"; object đã populate trong response admin/giáo viên
  // xem danh sách chung (xem learnerNeed.service.js listLearnerNeeds).
  studentId: string | LearnerNeedStudentInfo;
  subject: string;
  currentLevel?: string;
  goal: string;
  preferredFormat: PreferredFormat;
  preferredTimes?: AvailabilitySchedule | null;
  status: LearnerNeedStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLearnerNeedPayload {
  subject: string;
  currentLevel?: string;
  goal: string;
  preferredFormat: PreferredFormat;
  preferredTimes?: AvailabilitySchedule;
  note?: string;
}
