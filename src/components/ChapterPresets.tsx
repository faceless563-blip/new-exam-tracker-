import React from 'react';
import { motion } from 'motion/react';
import { Book, ChevronRight, Zap } from 'lucide-react';
import { NCTB_CURRICULUM, SUBJECTS, EXAM_TYPES } from '../constants';
import { ExamType } from '../types';
import { cn } from '../lib/utils';

interface ChapterPresetsProps {
  onSelect: (subject: string, chapter: string, type: ExamType) => void;
}

export const ChapterPresets: React.FC<ChapterPresetsProps> = ({ onSelect }) => {
  return (
    <div className="space-y-8">
      {SUBJECTS.map((subject) => (
        <div key={subject} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
              <Book size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{subject} Presets</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NCTB_CURRICULUM[subject as keyof typeof NCTB_CURRICULUM].map((chapter) => (
              <div 
                key={chapter} 
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-brand-300 transition-all group"
              >
                <p className="text-sm font-bold text-slate-800 mb-3 line-clamp-1">{chapter}</p>
                <div className="flex flex-wrap gap-2">
                  {EXAM_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => onSelect(subject, chapter, type as ExamType)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-brand-600 hover:text-white rounded-lg text-[10px] font-bold text-slate-500 transition-all border border-slate-100"
                    >
                      <Zap size={10} />
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
