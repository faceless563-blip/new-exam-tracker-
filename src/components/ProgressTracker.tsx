import React from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle2, Book, PieChart, BarChart3, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface SubjectProgress {
  name: string;
  completed: number;
  total: number;
  percentage: number;
}

interface TypeProgress {
  name: string;
  count: number;
  total: number;
}

interface ProgressTrackerProps {
  overallPercentage: number;
  subjectProgress: SubjectProgress[];
  typeProgress: TypeProgress[];
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  overallPercentage, 
  subjectProgress, 
  typeProgress 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-brand-100 rounded-lg">
          <PieChart className="text-brand-600" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Curriculum Progress</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Syllabus Completion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Progress Card */}
        <div className={cn(
          "md:col-span-1 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-200 transition-all duration-500",
          "bg-slate-900",
          "[[data-theme='cyberpunk']_&]:from-brand-600 [[data-theme='cyberpunk']_&]:to-black [[data-theme='cyberpunk']_&]:bg-gradient-to-br"
        )}>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Completion</p>
            <h4 className="text-4xl font-black mb-4">{Math.round(overallPercentage)}%</h4>
            
            <div className="space-y-4">
              {subjectProgress.map((subject) => (
                <div key={subject.name} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase">
                    <div className="flex items-center gap-2">
                      <span>{subject.name}</span>
                      <span className="text-brand-400">{Math.round(subject.percentage)}%</span>
                    </div>
                    <span>{subject.completed}/{subject.total}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.percentage}%` }}
                      className="h-full bg-brand-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Decorative Background Element */}
          <div className="absolute -bottom-6 -right-6 opacity-10">
            <Target size={120} />
          </div>
        </div>

        {/* Exam Type Coverage */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exam Type Coverage</p>
              <h4 className="text-lg font-bold text-slate-900">Practice Intensity</h4>
            </div>
            <BarChart3 className="text-slate-300" size={24} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {typeProgress.map((type) => (
              <div key={type.name} className="relative flex flex-col items-center text-center group">
                <div className="relative w-24 h-24 mb-3">
                  {/* Circular Progress Bar */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-100"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.2}
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset: 251.2 - (251.2 * (type.count / type.total)) }}
                      className="text-brand-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-900">{type.count}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Chapters</span>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-brand-600 transition-colors">
                  {type.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {Math.round((type.count / type.total) * 100)}% Coverage
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-600 shadow-sm">
                <Zap size={16} />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-700">Pro Tip:</span> Aim for 100% coverage in <span className="text-brand-600 font-bold">GST QB</span> to maximize your chances in the admission test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
