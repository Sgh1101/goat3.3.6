export type ScheduleType = 'exam' | 'event' | 'birthday';
export type RequestStatus = 'pending' | 'in_progress' | 'approved';

export interface ExtraLink {
  title: string;
  url: string;
}

export interface GlobalSettings {
  timetableLink: string;
  kakaoLink: string;
  schoolWebsiteLink?: string;
  nextExamDate?: string;
  nextExamTitle?: string;
  peDays?: number[]; // 0 for Sunday, 1 for Monday, etc.
  extraLinks?: ExtraLink[];
}

export type NoticeType = 'general' | 'teacher';

export interface Notice {
  id: string;
  content: string;
  type: NoticeType;
  createdAt: any; // Firestore Timestamp
}

export interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  type: ScheduleType;
}

export interface PerformanceAssessment {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  description?: string;
  createdAt: any;
}

export interface ExamRange {
  id: string;
  subject: string;
  range: string;
  examTitle: string;
  createdAt: any;
}

export interface ContentRequest {
  id: string;
  text: string;
  status: RequestStatus;
  authorEmail: string;
  createdAt: any; // Firestore Timestamp
}
