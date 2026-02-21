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
  Info
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
    
    if (isFullyDone) {
      const missingExamTypes = Object.values(ExamType).filter(type => !examTypes.has(type));
      if (missingExamTypes.length > 0) {
        warnings.push(`Missing exams: ${missingExamTypes.join(', ')}`);
      }
    }

    // Logic for revision reminders
    const now = new Date();
    if (isFullyDone && p.completedAt && !p.firstRevisionAt) {
      const dueDate = addDays(parseISO(p.completedAt), 3);
      if (isAfter(now, dueDate)) {
        reminders.push("Time for 1st revision!");
      } else {
        const daysLeft = differenceInDays(dueDate, now);
        reminders.push(`1st revision in ${daysLeft + 1} days`);
      }
    }

    if (p.firstRevisionAt && !p.secondRevisionAt) {
      const dueDate = addDays(parseISO(p.firstRevisionAt), 7);
      if (isAfter(now, dueDate)) {
        reminders.push("Time for 2nd revision!");
      } else {
        const daysLeft = differenceInDays(dueDate, now);
        reminders.push(`2nd revision in ${daysLeft + 1} days`);
      }
    }

    return { warnings, reminders, isFullyDone };
  };

  return (
    <div className="space-y-6">
      {/* Subject Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 w-fit">
        {SUBJECTS.map((subject) => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeSubject === subject 
                ? "bg-white text-brand-600 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {subject}
          </button>
        ))}
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
              {chapters.map((chapterName) => {
                const p = getChapterProgress(chapterName);
                const { warnings, reminders, isFullyDone } = getStatus(chapterName);
                
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
                          "p-2 rounded-lg transition-all",
                          p.isClassDone ? "text-emerald-500 bg-emerald-50" : "text-slate-300 hover:text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {p.isClassDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => onToggleTask(activeSubject, chapterName, 'uni')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          p.isUniQBDone ? "text-emerald-500 bg-emerald-50" : "text-slate-300 hover:text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {p.isUniQBDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => onToggleTask(activeSubject, chapterName, 'gst')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          p.isGSTQBDone ? "text-emerald-500 bg-emerald-50" : "text-slate-300 hover:text-slate-400 hover:bg-slate-100"
                        )}
                      >
                        {p.isGSTQBDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                    </td>

                    {/* Revision Checkboxes */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          disabled={!isFullyDone}
                          onClick={() => onToggleTask(activeSubject, chapterName, 'rev1')}
                          className={cn(
                            "p-2 rounded-lg transition-all disabled:opacity-20",
                            p.firstRevisionAt ? "text-brand-500 bg-brand-50" : "text-slate-300 hover:text-brand-400 hover:bg-slate-100"
                          )}
                        >
                          {p.firstRevisionAt ? <RefreshCw size={20} className="animate-spin-slow" /> : <Clock size={20} />}
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
                            "p-2 rounded-lg transition-all disabled:opacity-20",
                            p.secondRevisionAt ? "text-brand-500 bg-brand-50" : "text-slate-300 hover:text-brand-400 hover:bg-slate-100"
                          )}
                        >
                          {p.secondRevisionAt ? <RefreshCw size={20} className="animate-spin-slow" /> : <Clock size={20} />}
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
                          <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-brand-500 uppercase tracking-tight">
                            <RefreshCw size={12} />
                            <span>{r}</span>
                          </div>
                        ))}
                        {warnings.length === 0 && reminders.length === 0 && isFullyDone && p.secondRevisionAt && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-tight">
                            <CheckCircle2 size={12} />
                            <span>Mastered</span>
                          </div>
                        )}
                        {warnings.length === 0 && reminders.length === 0 && !isFullyDone && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                            <Info size={12} />
                            <span>In Progress</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
