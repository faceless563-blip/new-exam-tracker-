import React from 'react';
import { motion } from 'motion/react';
import { Clock, Bell, ChevronRight, CheckCircle2, Zap } from 'lucide-react';
import { ChapterProgress, Exam, ExamStatus } from '../types';
import { format, isSameDay, parseISO } from 'date-fns';
import { cn } from '../lib/utils';

interface RevisionRemindersProps {
  progress: ChapterProgress[];
  exams: Exam[];
  onChapterClick: (subject: string, chapter: string) => void;
}

export const RevisionReminders: React.FC<RevisionRemindersProps> = ({ progress, exams, onChapterClick }) => {
  const today = new Date();

  const reminders = progress.flatMap(p => {
    const items = [];
    
    // Check for 1st revision
    if (p.scheduledFirstRevisionAt && !p.firstRevisionAt) {
      const scheduledDate = parseISO(p.scheduledFirstRevisionAt);
      if (isSameDay(scheduledDate, today) || scheduledDate < today) {
        items.push({
          subject: p.subject,
          chapter: p.chapterName,
          type: '1st Revision',
          date: scheduledDate,
          isOverdue: scheduledDate < today && !isSameDay(scheduledDate, today)
        });
      }
    }

    // Check for 2nd revision
    if (p.scheduledSecondRevisionAt && !p.secondRevisionAt) {
      const scheduledDate = parseISO(p.scheduledSecondRevisionAt);
      if (isSameDay(scheduledDate, today) || scheduledDate < today) {
        items.push({
          subject: p.subject,
          chapter: p.chapterName,
          type: '2nd Revision',
          date: scheduledDate,
          isOverdue: scheduledDate < today && !isSameDay(scheduledDate, today)
        });
      }
    }

    return items;
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  if (reminders.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-brand-100 rounded-[2rem] p-6 shadow-sm shadow-brand-50 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Bell size={80} className="text-brand-600" />
      </div>

      <div className="flex items-center gap-2 mb-6 relative">
        <div className="p-2 bg-brand-50 rounded-lg">
          <Bell className="text-brand-600" size={20} />
        </div>
        <h3 className="font-bold text-slate-900">Revision Reminders</h3>
        <span className="bg-brand-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {reminders.length}
        </span>
      </div>

      <div className="space-y-3 relative">
        {reminders.map((reminder, idx) => (
          <button
            key={`${reminder.chapter}-${reminder.type}`}
            onClick={() => onChapterClick(reminder.subject, reminder.chapter)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group active:scale-[0.98]",
              reminder.isOverdue 
                ? "bg-rose-50 border-rose-100 hover:border-rose-200" 
                : "bg-slate-50 border-slate-100 hover:border-brand-200 hover:bg-white"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                reminder.isOverdue ? "bg-rose-100 text-rose-600" : "bg-brand-100 text-brand-600"
              )}>
                <Clock size={20} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reminder.subject}</span>
                  {reminder.isOverdue && (
                    <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-100 px-1.5 py-0.5 rounded">Overdue</span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{reminder.chapter}</h4>
                <p className="text-xs font-medium text-slate-500">{reminder.type} due {reminder.isOverdue ? 'since ' : ''}{format(reminder.date, 'MMM d')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};
