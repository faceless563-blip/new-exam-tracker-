export enum ExamStatus {
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ExamType {
  V_QB = 'V.QB',
  GST_QB = 'GST QB',
  PH_EXAM = 'PH EXAM',
  PAPER_FINAL = 'Paper Final',
  SUBJECT_FINAL = 'Subject Final',
  FULL_MOCK = 'Full Mock'
}

export interface Topic {
  id: string;
  name: string;
  isCompleted: boolean;
  isChapter?: boolean;
}

export interface ExamSection {
  name: string;
  correct: number;
  wrong: number;
  total: number;
}

export interface Exam {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | string;
  examType: ExamType;
  date: string; // ISO string
  location?: string;
  status: ExamStatus;
  targetGrade?: string;
  actualGrade?: string;
  grade?: string;
  topics: Topic[]; // Used for selected chapters
  notes?: string;
  color: string;
  totalMarks?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  negativeMarks?: number;
  obtainedMarks?: number;
  sections?: ExamSection[]; // For Full Mock tests
}

export interface StudySession {
  id: string;
  examId: string;
  date: string;
  durationMinutes: number;
  notes?: string;
}

export interface ChapterProgress {
  subject: string;
  chapterName: string;
  isClassDone: boolean;
  isUniQBDone: boolean;
  isGSTQBDone: boolean;
  completedAt?: string; // ISO string when all 3 are done
  firstRevisionAt?: string; // ISO string when 1st revision is done
  secondRevisionAt?: string; // ISO string when 2nd revision is done
  scheduledFirstRevisionAt?: string; // ISO string
  scheduledSecondRevisionAt?: string; // ISO string
}
