import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Calendar, MapPin, Target, CheckCircle2, Clock, Edit2, Trash2, Award, XCircle, CheckCircle } from 'lucide-react';
import { Exam, ExamStatus } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ExamCardProps {
  exam: Exam;
  onEdit: (exam: Exam) => void;
  onDelete: (id: string) => void;
  onToggleTopic: (examId: string, topicId: string) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam, onEdit, onDelete, onToggleTopic }) => {
  const daysRemaining = differenceInDays(new Date(exam.date), new Date());
  const isFail = exam.grade === 'F';
  
  const getStatusColor = (status: ExamStatus) => {
    switch (status) {
      case ExamStatus.UPCOMING: return 'text-blue-600 bg-blue-50 border-blue-100';
      case ExamStatus.COMPLETED: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case ExamStatus.CANCELLED: return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative bg-white rounded-3xl border p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300",
        isFail ? "border-rose-200 bg-rose-50/30" : "border-slate-200"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-12 rounded-full" 
            style={{ backgroundColor: exam.color }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{exam.subject}</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                {exam.examType}
              </span>
            </div>
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1",
              getStatusColor(exam.status)
            )}>
              {exam.status}
            </span>
          </div>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(exam)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(exam.id)}
            className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Calendar size={16} className="text-slate-400" />
          <span>{format(new Date(exam.date), 'PPP')}</span>
        </div>
        {exam.location && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <MapPin size={16} className="text-slate-400" />
            <span>{exam.location}</span>
          </div>
        )}
      </div>

      {/* Performance Grid */}
      {exam.totalMarks !== undefined && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-slate-50 p-3 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
            <p className="text-lg font-bold text-slate-700">{exam.totalMarks}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-emerald-400 uppercase">Correct</p>
            <p className="text-lg font-bold text-emerald-600">{exam.correctAnswers}</p>
          </div>
          <div className="bg-rose-50 p-3 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-rose-400 uppercase">Wrong</p>
            <p className="text-lg font-bold text-rose-600">{exam.wrongAnswers}</p>
          </div>
        </div>
      )}

      {/* Obtained Marks Banner */}
      {exam.obtainedMarks !== undefined && (
        <div className={cn(
          "p-4 rounded-2xl mb-6 flex items-center justify-between shadow-lg",
          isFail ? "bg-rose-600 shadow-rose-200" : "bg-brand-600 shadow-brand-200"
        )}>
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/10 rounded-lg">
              <Award size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase">Obtained Marks</p>
              <p className="text-xl font-black">{exam.obtainedMarks.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-[10px] font-bold text-white/60 uppercase">Grade</p>
            <p className="text-xl font-black">
              {exam.grade}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Chapters</h4>
          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
            {exam.topics.length} Chapters
          </span>
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
          {exam.topics.map(topic => (
            <button
              key={topic.id}
              onClick={() => onToggleTopic(exam.id, topic.id)}
              className={cn(
                "w-full flex items-center gap-2 text-xs p-2 rounded-lg transition-all",
                topic.isCompleted 
                  ? "text-slate-600 bg-slate-50" 
                  : "text-slate-400 bg-slate-50/50 opacity-60"
              )}
            >
              {topic.isCompleted ? (
                <CheckCircle size={14} className="text-emerald-500" />
              ) : (
                <XCircle size={14} className="text-slate-300" />
              )}
              <span className={cn("truncate", !topic.isCompleted && "line-through")}>{topic.name}</span>
            </button>
          ))}
        </div>
      </div>

      {exam.status === ExamStatus.UPCOMING && daysRemaining >= 0 && (
        <div className="absolute -top-3 -right-3 bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-brand-200 flex items-center gap-1.5">
          <Clock size={12} />
          {daysRemaining === 0 ? 'Today!' : `${daysRemaining}d left`}
        </div>
      )}
    </motion.div>
  );
};
