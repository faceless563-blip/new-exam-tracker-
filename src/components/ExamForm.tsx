import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Save, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';
import { Exam, ExamStatus, Topic, ExamType, ExamSection } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { NCTB_CURRICULUM, SUBJECTS, EXAM_TYPES, PAPER_FINALS, SUBJECT_FINALS, MOCK_TESTS } from '../constants';

interface ExamFormProps {
  exam?: Exam | null;
  onSave: (exam: Omit<Exam, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

const COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#64748b', '#22c55e'
];

export const ExamForm: React.FC<ExamFormProps> = ({ exam, onSave, onClose }) => {
  const [subject, setSubject] = useState<string>(exam?.subject || '');
  const [examType, setExamType] = useState<ExamType>(exam?.examType || ExamType.V_QB);
  const [date, setDate] = useState(exam?.date ? exam.date.slice(0, 10) : formatToday());
  const [location, setLocation] = useState(exam?.location || '');
  const [status, setStatus] = useState<ExamStatus>(exam?.status || ExamStatus.COMPLETED);
  const [color, setColor] = useState(exam?.color || COLORS[0]);
  const [topics, setTopics] = useState<Topic[]>(exam?.topics || []);
  
  // New Fields
  const [totalMarks, setTotalMarks] = useState<number | ''>(exam?.totalMarks || '');
  const [correctAnswers, setCorrectAnswers] = useState<number | ''>(exam?.correctAnswers || '');
  const [wrongAnswers, setWrongAnswers] = useState<number | ''>(exam?.wrongAnswers || '');
  const [sections, setSections] = useState<ExamSection[]>(exam?.sections || [
    { name: 'Physics', correct: 0, wrong: 0, total: 25 },
    { name: 'Math', correct: 0, wrong: 0, total: 25 },
    { name: 'Chemistry', correct: 0, wrong: 0, total: 25 },
    { name: 'English', correct: 0, wrong: 0, total: 25 },
  ]);
  const [error, setError] = useState<string | null>(null);

  function formatToday() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  const obtainedMarks = useMemo(() => {
    if (examType === ExamType.FULL_MOCK) {
      return sections.reduce((acc, s) => acc + (s.correct - (s.wrong / 4)), 0);
    }
    if (correctAnswers === '' || wrongAnswers === '') return 0;
    const deduction = Number(wrongAnswers) / 4;
    return Number(correctAnswers) - deduction;
  }, [correctAnswers, wrongAnswers, examType, sections]);

  const negativeMarks = useMemo(() => {
    if (examType === ExamType.FULL_MOCK) {
      return sections.reduce((acc, s) => acc + (s.wrong / 4), 0);
    }
    if (wrongAnswers === '') return 0;
    return Number(wrongAnswers) / 4;
  }, [wrongAnswers, examType, sections]);

  const calculateGrade = (score: number, total: number) => {
    if (!total) return 'F';
    const percentage = (score / total) * 100;
    
    if (examType === ExamType.FULL_MOCK) {
      if (percentage >= 80) return 'Elite';
      if (percentage >= 70) return 'Superior';
      if (percentage >= 60) return 'Excellent';
      if (percentage >= 50) return 'Good';
      if (percentage >= 40) return 'Average';
      return 'Needs Work';
    }

    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'A-';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  const baseSubject = useMemo(() => {
    if (SUBJECTS.includes(subject as any)) return subject;
    if (subject.includes('Physics')) return 'Physics';
    if (subject.includes('Chemistry')) return 'Chemistry';
    if (subject.includes('Math')) return 'Mathematics';
    return '';
  }, [subject]);

  const availableChapters = useMemo(() => {
    if (examType === ExamType.FULL_MOCK) return ['Full Syllabus'];
    if (!baseSubject || !(baseSubject in NCTB_CURRICULUM)) return [];
    return NCTB_CURRICULUM[baseSubject as keyof typeof NCTB_CURRICULUM];
  }, [baseSubject, examType]);

  const handleToggleChapter = (chapterName: string) => {
    const exists = topics.find(t => t.name === chapterName);
    if (exists) {
      setTopics(topics.filter(t => t.name !== chapterName));
    } else {
      setTopics([...topics, { id: crypto.randomUUID(), name: chapterName, isCompleted: true, isChapter: true }]);
    }
  };

  const handleSelectAllChapters = () => {
    const allTopics = availableChapters.map(chapter => ({
      id: crypto.randomUUID(),
      name: chapter,
      isCompleted: true,
      isChapter: true
    }));
    setTopics(allTopics);
  };

  const isChapterExam = useMemo(() => {
    return examType === ExamType.V_QB || examType === ExamType.GST_QB || examType === ExamType.PH_EXAM;
  }, [examType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject) return setError("Please select a subject.");
    if (!examType) return setError("Please select an exam type.");
    if (isChapterExam && topics.length === 0) return setError("Please select at least one chapter.");
    
    let finalTotalMarks = Number(totalMarks);
    let finalCorrect = Number(correctAnswers);
    let finalWrong = Number(wrongAnswers);

    if (examType === ExamType.FULL_MOCK) {
      finalTotalMarks = sections.reduce((acc, s) => acc + s.total, 0);
      finalCorrect = sections.reduce((acc, s) => acc + s.correct, 0);
      finalWrong = sections.reduce((acc, s) => acc + s.wrong, 0);
    } else {
      if (totalMarks === '' || correctAnswers === '' || wrongAnswers === '') return setError("Please fill in all marking fields.");
    }
    
    if (obtainedMarks > finalTotalMarks) {
      return setError("Obtained marks cannot exceed Total Marks.");
    }
    if (obtainedMarks < -25) { // Allow some negative marks but within reason
      return setError("Obtained marks are too low.");
    }

    const finalTopics = isChapterExam 
      ? topics 
      : [{ id: crypto.randomUUID(), name: subject, isCompleted: true, isChapter: false }];

    onSave({
      id: exam?.id,
      subject,
      examType,
      date: new Date(date).toISOString(),
      location,
      status,
      color,
      topics: finalTopics,
      totalMarks: finalTotalMarks,
      correctAnswers: finalCorrect,
      wrongAnswers: finalWrong,
      negativeMarks,
      obtainedMarks,
      grade: calculateGrade(obtainedMarks, finalTotalMarks),
      sections: examType === ExamType.FULL_MOCK ? sections : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {exam ? 'Edit Exam Record' : 'Add Exam Record'}
            </h2>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">GST TRACKER</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Subject</label>
              <select
                required
                value={subject}
                onChange={e => {
                  setSubject(e.target.value);
                  setTopics([]); // Reset chapters when subject changes
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all appearance-none bg-white"
              >
                <option value="">Select Subject</option>
                {examType === ExamType.PAPER_FINAL && PAPER_FINALS.map(s => <option key={s} value={s}>{s}</option>)}
                {examType === ExamType.SUBJECT_FINAL && SUBJECT_FINALS.map(s => <option key={s} value={s}>{s}</option>)}
                {examType === ExamType.FULL_MOCK && MOCK_TESTS.map(s => <option key={s} value={s}>{s}</option>)}
                {(examType === ExamType.V_QB || examType === ExamType.GST_QB || examType === ExamType.PH_EXAM) && SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Exam Type</label>
              <select
                required
                value={examType}
                onChange={e => setExamType(e.target.value as ExamType)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all appearance-none bg-white"
              >
                {EXAM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Exam Date</label>
              <input
                required
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Chapters Section */}
          {isChapterExam && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Select Chapters (NCTB)</label>
                <div className="flex items-center gap-3">
                  {availableChapters.length > 1 && (
                    <button 
                      type="button" 
                      onClick={handleSelectAllChapters}
                      className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700"
                    >
                      Select All
                    </button>
                  )}
                  <span className="text-xs text-slate-400">{topics.length} selected</span>
                </div>
              </div>
              
              {!subject ? (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 text-sm">
                  Select a subject first to load chapters
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                  {availableChapters.map(chapter => {
                    const isSelected = topics.some(t => t.name === chapter);
                    return (
                      <button
                        key={chapter}
                        type="button"
                        onClick={() => handleToggleChapter(chapter)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm",
                          isSelected 
                            ? "bg-brand-50 border-brand-200 text-brand-700 font-medium" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        <CheckCircle2 size={18} className={cn(isSelected ? "text-brand-500" : "text-slate-200")} />
                        {chapter}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Performance Section */}
          <div className="bg-slate-50 p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              Performance & Marking
            </h3>
            
            {examType === ExamType.FULL_MOCK ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="col-span-1">Section</div>
                  <div className="text-center">Correct</div>
                  <div className="text-center">Wrong</div>
                  <div className="text-center">Total</div>
                </div>
                {sections.map((s, idx) => (
                  <div key={s.name} className="grid grid-cols-4 gap-4 items-center bg-white p-3 rounded-2xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm">{s.name}</div>
                    <input
                      type="number"
                      min="0"
                      max={s.total}
                      value={s.correct}
                      onChange={e => {
                        const newSections = [...sections];
                        newSections[idx].correct = Number(e.target.value);
                        setSections(newSections);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-100 text-center text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max={s.total}
                      value={s.wrong}
                      onChange={e => {
                        const newSections = [...sections];
                        newSections[idx].wrong = Number(e.target.value);
                        setSections(newSections);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-100 text-center text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <div className="text-center font-bold text-slate-400 text-sm">{s.total}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Total Marks</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={totalMarks}
                    onChange={e => setTotalMarks(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Correct Answers</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={correctAnswers}
                    onChange={e => setCorrectAnswers(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Wrong Answers</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={wrongAnswers}
                    onChange={e => setWrongAnswers(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
              <div className="flex gap-8">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-400 uppercase">Calculated Score</p>
                    <span className="text-[8px] font-black bg-slate-100 px-1 py-0.5 rounded text-slate-400 uppercase tracking-tighter">
                      {correctAnswers || 0} - {negativeMarks.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">
                    {obtainedMarks.toFixed(2)}
                    <span className="text-sm font-medium text-slate-400 ml-1">
                      / {examType === ExamType.FULL_MOCK ? sections.reduce((acc, s) => acc + s.total, 0) : (totalMarks || '0')}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-500 uppercase">Deduction</p>
                  <p className="text-xl font-black text-amber-600">
                    -{negativeMarks.toFixed(2)}
                  </p>
                  <p className="text-[8px] text-amber-400 font-bold uppercase">0.25 per wrong</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Grade</p>
                <p className={cn(
                  "text-2xl font-black",
                  calculateGrade(obtainedMarks, examType === ExamType.FULL_MOCK ? 100 : Number(totalMarks)) === 'F' || calculateGrade(obtainedMarks, 100) === 'Needs Work' ? "text-rose-500" : "text-emerald-500"
                )}>
                  {calculateGrade(obtainedMarks, examType === ExamType.FULL_MOCK ? 100 : Number(totalMarks))}
                </p>
              </div>
            </div>
          </div>

          {/* Theme Color */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Theme Color</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all ring-offset-2",
                    color === c ? "ring-2 ring-slate-900 scale-110" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {exam ? 'Update Record' : 'Submit Exam'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
