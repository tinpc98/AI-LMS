// Keep UI specific interfaces
export interface OverviewCardItem {
  key: string;
  title: string;
  value: number;
  suffix?: string;
  trend: number;
  trendType: "up" | "down";
  trendLabel: string;
  color: string;
  bgColor: string;
  iconName: string;
}

export interface QuickAccessItem {
  key: string;
  title: string;
  description: string;
  path: string;
  iconName: string;
  color: string;
  bgColor: string;
  badge?: string;
}

// API Response interfaces
export interface RecentClassRecord {
  _id: string;
  className: string;
  classCode: string;
  maxStudents: number;
  currentStudents: number;
  studentCount: number;
  status: string;
  createdAt: string;

  teacher?: {
    fullName: string;
    email: string;
  };

  course?: {
    courseName: string;
  };
}

export interface DashboardResponse {
  totalUsers: number;
  activeTeachers: number;
  activeStudents: number;
  totalClasses: number;
  totalCourses: number;

  systemHealth: {
    status: string;
    dbConnection: string;
    uptimeSeconds: number;
  };

  activeClasses: number;
  assignedClasses: number;
  unassignedClasses: number;

  classStatusChart: {
    status: string;
    count: number;
  }[];

  studentRegistrationChart: {
    month: string;
    count: number;
  }[];

  courseDistribution: {
    courseId: string;
    courseName: string;
    subject?: string;
    classCount: number;
  }[];

  recentClasses: RecentClassRecord[];

  recentUsers: {
    _id: string;
    fullName: string;
    email: string;
    avatar: string;
    role: string;
    status: string;
    createdAt: string;
  }[];
}
