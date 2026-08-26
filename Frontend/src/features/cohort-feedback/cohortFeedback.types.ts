export interface SubmitCohortFeedbackPayload {
  ratingClarity: number;
  ratingHelpfulness: number;
  comment?: string;
}

export interface CohortFeedbackRecord {
  _id: string;
  classId: string;
  studentId: string;
  teacherId: string;
  ratingClarity: number;
  ratingHelpfulness: number;
  comment?: string;
  submittedAt: string;
}

export interface TeacherAverageRatings {
  count: number;
  avgClarity: number | null;
  avgHelpfulness: number | null;
}
