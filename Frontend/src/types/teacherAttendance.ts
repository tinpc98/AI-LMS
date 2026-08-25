export type TeacherAttendanceStatus =
    | "PENDING"
    | "CONFIRMED"
    | "ABSENT";

export interface SessionPopulated {
    _id: string;
    title?: string;
    sessionNumber?: number;

    scheduledStartAt?: string | null;
    scheduledEndAt?: string | null;

    actualStartAt?: string | null;
    actualEndAt?: string | null;

    status: string;

    onlineMeeting?: {
        url?: string;
    } | null;
}

export interface ITeacherAttendance {
    _id: string;

    teacherId: string;

    sessionId: SessionPopulated;

    status: TeacherAttendanceStatus;

    confirmedAt?: string | null;
    lockedAt?: string | null;

    createdAt?: string;
    updatedAt?: string;
}

export interface TeacherAttendanceQueryParams {
    status?: TeacherAttendanceStatus;
    classId?: string;
    page?: number;
    limit?: number;
}

export interface Pagination {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}

export interface TeacherAttendanceListResponse {
    success: boolean;
    message?: string;
    data: ITeacherAttendance[];
    pagination: Pagination;
}

export interface TeacherAttendanceResponse {
    success: boolean;
    message?: string;
    data?: ITeacherAttendance;
}