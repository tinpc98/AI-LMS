export interface IExam {
  _id: string;
  title: string;
  duration: number; // Thời gian làm bài (phút)
  startTime: string; // Ngày/giờ bắt đầu thi
  endTime?: string;
  description?: string;
  classId?: string;
  totalQuestions?: number;
  format?: string;
  status?: "UPCOMING" | "ONGOING" | "ENDED";
}
