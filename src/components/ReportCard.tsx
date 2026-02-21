import React from 'react';
import { Award, TrendingUp, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SubjectGrade {
  name: string;
  accuracy: number;
  grade: string;
  totalExams: number;
}

interface ReportCardProps {
  overallGrade: string;
  overallAccuracy: number;
  subjectGrades: SubjectGrade[];
}

export const ReportCard: React.FC<ReportCardProps> = ({ overallGrade, overallAccuracy, subjectGrades }) => {
  const getGradeColor = (grade: string) => {
    if (grade === 'A+') return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (grade.startsWith('A')) return 'text-blue-500 bg-blue-50 border-blue-100';
    if (grade === 'F') return 'text-rose-500 bg-rose-50 border-rose-100';
    return 'text-amber-500 bg-amber-50 border-amber-100';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className={cn(
        "p-6 text-white transition-all duration-500",
        "bg-slate-900",
        "[[data-theme='cyberpunk']_&]:from-brand-600 [[data-theme='cyberpunk']_&]:to-black [[data-theme='cyberpunk']_&]:bg-gradient-to-br"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Award size={24} className="text-brand-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Performance Report</h3>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">GST FIGHT Official</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Overall Grade</p>
            <p className={cn(
              "text-4xl font-black",
              overallGrade === 'F' ? "text-rose-500" : "text-brand-400"
            )}>{overallGrade}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Overall Accuracy</span>
            <span>{Math.round(overallAccuracy)}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${overallAccuracy}%` }}
              className="h-full bg-brand-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen size={14} />
            Subject Wise Grading
          </h4>
          <div className="space-y-3">
            {subjectGrades.map((subject) => (
              <div 
                key={subject.name}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:border-brand-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:text-brand-500 transition-colors">
                    {subject.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{subject.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{subject.totalExams} Exams Taken</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
                    <p className="text-xs font-bold text-slate-700">{Math.round(subject.accuracy)}%</p>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-xl border flex items-center justify-center font-black text-lg shadow-sm",
                    getGradeColor(subject.grade)
                  )}>
                    {subject.grade}
                  </div>
                </div>
              </div>
            ))}
            {subjectGrades.length === 0 && (
              <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-slate-400 text-sm">No exam data available yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <TrendingUp size={12} />
            Performance Insight
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed italic">
            "Consistency is the key to GST success. Focus on your weak chapters to push your overall grade to A+."
          </p>
        </div>
      </div>
    </div>
  );
};
