import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Target, Award, Zap, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChapterReportCardProps {
  performance: any[];
}

export const ChapterReportCard: React.FC<ChapterReportCardProps> = ({ performance }) => {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const getGradeColor = (grade: string) => {
    if (grade === 'A+') return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (grade.startsWith('A')) return 'text-blue-500 bg-blue-50 border-blue-100';
    if (grade === 'F') return 'text-rose-500 bg-rose-50 border-rose-100';
    return 'text-amber-500 bg-amber-50 border-amber-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-brand-100 rounded-lg">
          <Zap className="text-brand-600" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Exam Type Performance</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chapter Wise Breakdown</p>
        </div>
      </div>

      {performance.map((typeData) => (
        <div 
          key={typeData.type} 
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all"
        >
          <button
            onClick={() => setExpandedType(expandedType === typeData.type ? null : typeData.type)}
            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-slate-200">
                {typeData.type}
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900">{typeData.type} Analysis</h4>
                <p className="text-xs text-slate-400 font-medium">{typeData.subjects.length} Subjects Tracked</p>
              </div>
            </div>
            {expandedType === typeData.type ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
          </button>

          <AnimatePresence>
            {expandedType === typeData.type && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-100"
              >
                <div className="p-5 space-y-8">
                  {typeData.subjects.map((subjectData: any) => (
                    <div key={subjectData.subject} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={16} className="text-brand-500" />
                        <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          {subjectData.subject}
                        </h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjectData.chapters.map((chapter: any) => (
                          <div 
                            key={chapter.name} 
                            className={cn(
                              "p-4 rounded-2xl border transition-all relative overflow-hidden group",
                              chapter.grade === 'F' ? "bg-rose-50/30 border-rose-100" : "bg-slate-50 border-slate-100"
                            )}
                          >
                            <div className="flex justify-between items-start mb-3 relative z-10">
                              <div className="max-w-[70%]">
                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{chapter.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{chapter.count} Exams Taken</p>
                              </div>
                              <div className={cn(
                                "w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shadow-sm",
                                getGradeColor(chapter.grade)
                              )}>
                                {chapter.grade}
                              </div>
                            </div>
                            
                            <div className="space-y-2 relative z-10">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>Accuracy</span>
                                <span>{Math.round(chapter.accuracy)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${chapter.accuracy}%` }}
                                  className={cn(
                                    "h-full rounded-full",
                                    chapter.grade === 'F' ? "bg-rose-500" : "bg-brand-500"
                                  )}
                                />
                              </div>
                            </div>
                            
                            {/* Background Decoration */}
                            <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                              <Target size={60} className="text-slate-900" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {performance.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <Zap size={32} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">Complete some exams to see detailed chapter reports</p>
        </div>
      )}
    </div>
  );
};
