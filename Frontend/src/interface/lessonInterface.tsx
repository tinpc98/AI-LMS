// Frontend/src/interface/lessonInterface.tsx
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
  order: number;
  isPublished: boolean;
  duration: number; // phút
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
  order?: number;
  isPublished?: boolean;
  duration?: number;
}
