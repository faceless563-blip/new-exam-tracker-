import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  BookOpen, 
  ChevronRight,
  Info,
  AlertCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Exam, ExamType, ChapterProgress, ExamStatus } from '../types';
import { NCTB_CURRICULUM, SUBJECTS } from '../constants';
import { format, addDays, isAfter, parseISO, differenceInDays } from 'date-fns';

interface CurriculumTrackerProps {
  exams: Exam[];
  progress: ChapterProgress[];
  onToggleTask: (subject: string, chapterName: string, task: 'class' | 'uni' | 'gst' | 'rev1' | 'rev2') => void;
}

export const CurriculumTracker: React.FC<CurriculumTrackerProps> = ({ exams, progress, onToggleTask }) => {
  const [activeSubject, setActiveSubject] = useState<string>(SUBJECTS[0]);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'NEEDS_REVISION' | 'COMPLETED'>('ALL');

  const chapters = NCTB_CURRICULUM[activeSubject as keyof typeof NCTB_CURRICULUM] || [];

  const getChapterProgress = (chapterName: string) => {
    return progress.find(p => p.subject === activeSubject && p.chapterName === chapterName) || {
      subject: activeSubject,
      chapterName,
      isClassDone: false,
      isUniQBDone: false,
      isGSTQBDone: false,
    };
  };

  const getChapterExams = (chapterName: string) => {
    return exams.filter(e => 
      e.subject === activeSubject && 
      e.status === ExamStatus.COMPLETED &&
      e.topics.some(t => t.name === chapterName)
    );
  };

  const getStatus = (chapterName: string) => {
    const p = getChapterProgress(chapterName);
    const e = getChapterExams(chapterName);
    const examTypes = new Set(e.map(exam => exam.examType));
    
    const warnings: string[] = [];
    const reminders: string[] = [];

    // Logic for warnings
    if (p.isClassDone && (!p.isUniQBDone || !p.isGSTQBDone)) {
      if (!p.isUniQBDone) warnings.push("Missing University QB solving");
      if (!p.isGSTQBDone) warnings.push("Missing GST QB solving");
    }

    const isFullyDone = p.isClassDone && p.isUniQBDone && p.isGSTQBDone;
    const hasTakenExam = e.length > 0;
    const hasHighScoredExam = e.some(exam => 
      exam.obtainedMarks !== undefined && exam.totalMarks && (exam.obtainedMarks / exam.totalMarks) >= 0.8
    );

    const isCompleted = isFullyDone && hasTakenExam;
    const isMastered = p.firstRevisionAt && p.secondRevisionAt && hasHighScoredExam;
    
    if (isFullyDone && !hasTakenExam) {
      warnings.push("Missing: At least one exam required for completion");
    }

    if (p.firstRevisionAt && p.secondRevisionAt && !hasHighScoredExam) {
      warnings.push("Mastery Gate: Score > 80% in an exam required");
    }

    // Logic for revision reminders
    const now = new Date();
    let statusType: 'ON_TRACK' | 'BEHIND' | 'MASTERED' | 'COMPLETED' | 'IDLE' = 'IDLE';

    if (isMastered) {
      statusType = 'MASTERED';
    } else if (isCompleted) {
      statusType = 'COMPLETED';
      if (p.secondRevisionAt) {
        // If completed and 2nd revision done but not mastered (missing 80% score)
        statusType = 'COMPLETED';
      } else if (p.firstRevisionAt) {
        const dueDate = addDays(parseISO(p.firstRevisionAt), 7);
        const daysDiff = differenceInDays(dueDate, now);
        if (daysDiff < 0) {
          statusType = 'BEHIND';
          reminders.push(`Behind: 2nd revision due ${Math.abs(daysDiff)}d ago`);
        } else {
          statusType = 'ON_TRACK';
          reminders.push(`2nd revision in ${daysDiff} days`);
        }
      } else if (p.completedAt) {
        const dueDate = addDays(parseISO(p.completedAt), 3);
        const daysDiff = differenceInDays(dueDate, now);
        if (daysDiff < 0) {
          statusType = 'BEHIND';
          reminders.push(`Behind: 1st revision due ${Math.abs(daysDiff)}d ago`);
        } else {
          statusType = 'ON_TRACK';
          reminders.push(`1st revision in ${daysDiff} days`);
        }
      }
    } else if (p.isClassDone) {
      statusType = 'ON_TRACK';
    }

    return { warnings, reminders, isCompleted, isMastered, statusType };
  };

  const filteredChapters = useMemo(() => {
    return chapters.filter(chapterName => {
      if (filter === 'ALL') return true;
      const { isCompleted, isMastered } = getStatus(chapterName);
      
      if (filter === 'IN_PROGRESS') return !isCompleted;
      if (filter === 'NEEDS_REVISION') return isCompleted && !isMastered;
      if (filter === 'COMPLETED') return isMastered;
      return true;
    });
  }, [chapters, progress, exams, filter, activeSubject]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Subject Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 w-fit">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject)}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all active:scale-95",
                activeSubject === subject 
                  ? "bg-white text-brand-600 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              {subject}
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 w-fit">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'NEEDS_REVISION', label: 'Needs Revision' },
            { id: 'COMPLETED', label: 'Completed' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95",
                filter === f.id 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Curriculum Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapter Name</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Class</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Uni QB</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">GST QB</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rev 1</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rev 2</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status & Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChapters.length > 0 ? (
                filteredChapters.map((chapterName) => {
                  const p = getChapterProgress(chapterName);
                  const { warnings, reminders, isCompleted, isMastered, statusType } = getStatus(chapterName);
                  
                  return (
                    <tr key={chapterName} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 group-hover:text-brand-600 transition-colors">{chapterName}</p>
                    </td>
                    
                    {/* Checkboxes */}
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => onToggleTask(activeSubject, chapterName, 'class')}
                        className={cn(
                          "p-2 rounded-lg transition-all active:scale-90",
                          p.isClassDone 
                            ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" 
                            : "text-slate-300 hover:text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={p.isClassDone ? 'done' : 'todo'}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            {p.isClassDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </motion.div>
                        </AnimatePresence>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => onToggleTask(activeSubject, chapterName, 'uni')}
                        className={cn(
                          "p-2 rounded-lg transition-all active:scale-90",
                          p.isUniQBDone 
                            ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" 
                            : "text-slate-300 hover:text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={p.isUniQBDone ? 'done' : 'todo'}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            {p.isUniQBDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </motion.div>
                        </AnimatePresence>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => onToggleTask(activeSubject, chapterName, 'gst')}
                        className={cn(
                          "p-2 rounded-lg transition-all active:scale-90",
                          p.isGSTQBDone 
                            ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" 
                            : "text-slate-300 hover:text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={p.isGSTQBDone ? 'done' : 'todo'}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            {p.isGSTQBDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </motion.div>
                        </AnimatePresence>
                      </button>
                    </td>

                    {/* Revision Checkboxes */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          disabled={!isCompleted}
                          onClick={() => onToggleTask(activeSubject, chapterName, 'rev1')}
                          className={cn(
                            "p-2 rounded-lg transition-all disabled:opacity-20 active:scale-90",
                            p.firstRevisionAt 
                              ? "text-brand-500 bg-brand-50 hover:bg-brand-100" 
                              : "text-slate-300 hover:text-brand-400 hover:bg-slate-100"
                          )}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={p.firstRevisionAt ? 'done' : 'todo'}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              {p.firstRevisionAt ? <RefreshCw size={20} className="animate-spin-slow" /> : <Clock size={20} />}
                            </motion.div>
                          </AnimatePresence>
                        </button>
                        {p.scheduledFirstRevisionAt && !p.firstRevisionAt && (
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            {format(parseISO(p.scheduledFirstRevisionAt), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          disabled={!p.firstRevisionAt}
                          onClick={() => onToggleTask(activeSubject, chapterName, 'rev2')}
                          className={cn(
                            "p-2 rounded-lg transition-all disabled:opacity-20 active:scale-90",
                            p.secondRevisionAt 
                              ? "text-brand-500 bg-brand-50 hover:bg-brand-100" 
                              : "text-slate-300 hover:text-brand-400 hover:bg-slate-100"
                          )}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={p.secondRevisionAt ? 'done' : 'todo'}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              {p.secondRevisionAt ? <RefreshCw size={20} className="animate-spin-slow" /> : <Clock size={20} />}
                            </motion.div>
                          </AnimatePresence>
                        </button>
                        {p.scheduledSecondRevisionAt && !p.secondRevisionAt && (
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            {format(parseISO(p.scheduledSecondRevisionAt), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Alerts Column */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {warnings.map((w, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                            <AlertTriangle size={12} />
                            <span>{w}</span>
                          </div>
                        ))}
                        {reminders.map((r, i) => (
                          <div key={i} className={cn(
                            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight",
                            statusType === 'BEHIND' ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md" : "text-brand-500"
                          )}>
                            {statusType === 'BEHIND' ? <AlertCircle size={12} /> : <RefreshCw size={12} />}
                            <span>{r}</span>
                          </div>
                        ))}
                        {isMastered && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-md uppercase tracking-tight">
                            <Zap size={12} />
                            <span>Mastered</span>
                          </div>
                        )}
                        {isCompleted && !isMastered && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tight">
                            <CheckCircle2 size={12} />
                            <span>Completed</span>
                          </div>
                        )}
                        {statusType === 'ON_TRACK' && !isCompleted && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-tight">
                            <TrendingUp size={12} />
                            <span>On Track</span>
                          </div>
                        )}
                        {statusType === 'IDLE' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                            <Info size={12} />
                            <span>In Progress</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <BookOpen size={32} className="opacity-20" />
                    <p className="text-sm font-medium">No chapters found for this filter</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <AlertTriangle size={14} className="text-rose-500" />
          <span>Warning: Missing Tasks</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <RefreshCw size={14} className="text-brand-500" />
          <span>Reminder: Revision Due</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>Success: Fully Completed</span>
        </div>
      </div>
    </div>
  );
};
