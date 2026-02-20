export enum ExamStatus {
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Topic {
  id: string;
  name: string;
  isCompleted: boolean;
}

export interface Exam {
  id: string;
  subject: string;
  date: string; // ISO string
  location?: string;
  status: ExamStatus;
  targetGrade?: string;
  actualGrade?: string;
  topics: Topic[];
  notes?: string;
  color: string;
}

export interface StudySession {
  id: string;
  examId: string;
  date: string;
  durationMinutes: number;
  notes?: string;
}
