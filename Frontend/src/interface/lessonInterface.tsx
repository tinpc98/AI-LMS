export interface ILessonAttachment {
  name: string;
  url: string;
  publicId: string;
}

export interface ILesson {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  attachments: ILessonAttachment[];
  classId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateLessonPayload {
  title: string;
  description?: string;
  videoUrl?: string;
  classId: string;
  files?: File[];
}
