/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  GraduationCap, 
  BookOpen,
  TrendingUp, 
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Palette,
  Moon,
  Sun,
  Zap,
  Sparkles
} from 'lucide-react';
import { Exam, ExamStatus, ExamType, ChapterProgress } from './types';
import { ExamCard } from './components/ExamCard';
import { ExamForm } from './components/ExamForm';
import { AIStudyBuddy } from './components/AIStudyBuddy';
import { ReportCard } from './components/ReportCard';
import { ChapterPresets } from './components/ChapterPresets';
import { ChapterReportCard } from './components/ChapterReportCard';
import { ProgressTracker } from './components/ProgressTracker';
import { CurriculumTracker } from './components/CurriculumTracker';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { format, isAfter, isBefore, startOfDay, addDays } from 'date-fns';
import { NCTB_CURRICULUM, SUBJECTS, EXAM_TYPES } from './constants';

type Theme = 'light' | 'dark' | 'midnight' | 'forest' | 'cyberpunk';

export default function App() {
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('exams');
    return saved ? JSON.parse(saved) : [];
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'presets'>('grid');
  const [filterStatus, setFilterStatus] = useState<ExamStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<ExamType | 'ALL'>('ALL');
  const [undoState, setUndoState] = useState<{ exams: Exam[], message: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'exams' | 'curriculum'>('exams');
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>(() => {
    const saved = localStorage.getItem('chapterProgress');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (undoState) {
      const timer = setTimeout(() => setUndoState(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [undoState]);

  const handleUndo = () => {
    if (undoState) {
      setExams(undoState.exams);
      setUndoState(null);
    }
  };

  const triggerUndoableAction = (newExams: Exam[], message: string) => {
    setUndoState({ exams, message });
    setExams(newExams);
  };

  useEffect(() => {
    localStorage.setItem('exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('chapterProgress', JSON.stringify(chapterProgress));
  }, [chapterProgress]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSaveExam = (examData: Omit<Exam, 'id'> & { id?: string }) => {
    if (examData.id) {
      setExams(exams.map(e => e.id === examData.id ? { ...examData, id: e.id } as Exam : e));
    } else {
      const newExam: Exam = {
        ...examData,
        id: crypto.randomUUID(),
      } as Exam;
      setExams([...exams, newExam]);
    }
    setIsFormOpen(false);
    setEditingExam(null);
  };

  const handlePresetSelect = (subject: string, chapter: string, type: any) => {
    const newExam: Partial<Exam> = {
      subject,
      examType: type,
      topics: [{ id: crypto.randomUUID(), name: chapter, isCompleted: true, isChapter: true }],
      status: ExamStatus.COMPLETED,
      color: '#ec4899',
    };
    setEditingExam(newExam as Exam);
    setIsFormOpen(true);
  };

  const handleDeleteExam = (id: string) => {
    const examToDelete = exams.find(e => e.id === id);
    if (examToDelete) {
      const newExams = exams.filter(e => e.id !== id);
      triggerUndoableAction(newExams, `Deleted ${examToDelete.subject} exam`);
    }
  };

  const handleToggleTopic = (examId: string, topicId: string) => {
    const newExams = exams.map(e => {
      if (e.id === examId) {
        return {
          ...e,
          topics: e.topics.map(t => t.id === topicId ? { ...t, isCompleted: !t.isCompleted } : t)
        };
      }
      return e;
    });
    triggerUndoableAction(newExams, 'Updated chapter status');
  };

  const handleToggleTask = (subject: string, chapterName: string, task: 'class' | 'uni' | 'gst' | 'rev1' | 'rev2') => {
    setChapterProgress(prev => {
      const existing = prev.find(p => p.subject === subject && p.chapterName === chapterName);
      let updated: ChapterProgress;
      
      if (existing) {
        updated = { ...existing };
        if (task === 'class') updated.isClassDone = !updated.isClassDone;
        if (task === 'uni') updated.isUniQBDone = !updated.isUniQBDone;
        if (task === 'gst') updated.isGSTQBDone = !updated.isGSTQBDone;
        if (task === 'rev1') updated.firstRevisionAt = updated.firstRevisionAt ? undefined : new Date().toISOString();
        if (task === 'rev2') updated.secondRevisionAt = updated.secondRevisionAt ? undefined : new Date().toISOString();
      } else {
        updated = {
          subject,
          chapterName,
          isClassDone: task === 'class',
          isUniQBDone: task === 'uni',
          isGSTQBDone: task === 'gst',
          firstRevisionAt: task === 'rev1' ? new Date().toISOString() : undefined,
          secondRevisionAt: task === 'rev2' ? new Date().toISOString() : undefined,
        };
      }

      // Set completion timestamp if all 3 core tasks are done
      if (updated.isClassDone && updated.isUniQBDone && updated.isGSTQBDone && !updated.completedAt) {
        updated.completedAt = new Date().toISOString();
        updated.scheduledFirstRevisionAt = addDays(new Date(), 3).toISOString();
      } else if (!(updated.isClassDone && updated.isUniQBDone && updated.isGSTQBDone)) {
        updated.completedAt = undefined;
        updated.scheduledFirstRevisionAt = undefined;
        updated.scheduledSecondRevisionAt = undefined;
      }

      // Schedule second revision when first is done
      if (updated.firstRevisionAt && !updated.scheduledSecondRevisionAt) {
        updated.scheduledSecondRevisionAt = addDays(new Date(updated.firstRevisionAt), 7).toISOString();
      } else if (!updated.firstRevisionAt) {
        updated.scheduledSecondRevisionAt = undefined;
      }

      const filtered = prev.filter(p => !(p.subject === subject && p.chapterName === chapterName));
      return [...filtered, updated];
    });
  };

  const filteredExams = useMemo(() => {
    return exams
      .filter(e => {
        const matchesSearch = e.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
        const matchesType = filterType === 'ALL' || e.examType === filterType;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams, searchQuery, filterStatus, filterType]);

  const calculateGrade = (accuracy: number) => {
    if (accuracy >= 90) return 'A+';
    if (accuracy >= 80) return 'A';
    if (accuracy >= 70) return 'A-';
    if (accuracy >= 60) return 'B';
    if (accuracy >= 50) return 'C';
    return 'F';
  };

  const stats = useMemo(() => {
    const upcoming = exams.filter(e => e.status === ExamStatus.UPCOMING).length;
    const completed = exams.filter(e => e.status === ExamStatus.COMPLETED).length;
    const totalChapters = exams.reduce((acc, e) => acc + e.topics.length, 0);
    
    // Calculate average accuracy for completed exams
    const completedExams = exams.filter(e => e.obtainedMarks !== undefined && e.totalMarks);
    const avgAccuracy = completedExams.length > 0
      ? completedExams.reduce((acc, e) => acc + (e.obtainedMarks! / e.totalMarks! * 100), 0) / completedExams.length
      : 0;

    const overallGrade = calculateGrade(avgAccuracy);

    // Progress Tracking Stats
    const totalChaptersInCurriculum = Object.values(NCTB_CURRICULUM).reduce((acc, chapters) => acc + chapters.length, 0);
    const coveredChaptersSet = new Set<string>();
    const subjectCoveredChapters: Record<string, Set<string>> = {
      Physics: new Set(),
      Chemistry: new Set(),
      Mathematics: new Set()
    };
    const typeCoveredChapters: Record<string, Set<string>> = {
      'V.QB': new Set(),
      'GST QB': new Set(),
      'PH EXAM': new Set()
    };

    exams.forEach(e => {
      if (e.status === ExamStatus.COMPLETED) {
        e.topics.forEach(t => {
          coveredChaptersSet.add(`${e.subject}-${t.name}`);
          subjectCoveredChapters[e.subject]?.add(t.name);
          typeCoveredChapters[e.examType]?.add(t.name);
        });
      }
    });

    const overallPercentage = (coveredChaptersSet.size / totalChaptersInCurriculum) * 100;

    const subjectProgress = Object.entries(NCTB_CURRICULUM).map(([name, chapters]) => {
      const completed = subjectCoveredChapters[name]?.size || 0;
      const total = chapters.length;
      return {
        name,
        completed,
        total,
        percentage: (completed / total) * 100
      };
    });

    const typeProgress = Object.values(ExamType).map(type => {
      return {
        name: type,
        count: typeCoveredChapters[type]?.size || 0,
        total: totalChaptersInCurriculum
      };
    });

    return { 
      upcoming, 
      completed, 
      totalChapters, 
      avgAccuracy, 
      overallGrade, 
      overallPercentage, 
      subjectProgress, 
      typeProgress 
    };
  }, [exams]);

  const analysis = useMemo(() => {
    const subjectStats: Record<string, { total: number; obtained: number; count: number }> = {};
    const chapterStats: Record<string, { total: number; obtained: number; count: number }> = {};

    exams.forEach(e => {
      if (e.obtainedMarks !== undefined && e.totalMarks) {
        // Subject stats
        if (!subjectStats[e.subject]) subjectStats[e.subject] = { total: 0, obtained: 0, count: 0 };
        subjectStats[e.subject].total += e.totalMarks;
        subjectStats[e.subject].obtained += e.obtainedMarks;
        subjectStats[e.subject].count += 1;

        // Chapter stats
        e.topics.forEach(topic => {
          if (!chapterStats[topic.name]) chapterStats[topic.name] = { total: 0, obtained: 0, count: 0 };
          chapterStats[topic.name].total += e.totalMarks!;
          chapterStats[topic.name].obtained += e.obtainedMarks!;
          chapterStats[topic.name].count += 1;
        });
      }
    });

    const subjectGrades = Object.entries(subjectStats).map(([name, stats]) => {
      const accuracy = (stats.obtained / stats.total) * 100;
      return {
        name,
        accuracy,
        grade: calculateGrade(accuracy),
        totalExams: stats.count
      };
    }).sort((a, b) => b.accuracy - a.accuracy);

    const weakSubjects = [...subjectGrades]
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 1);

    const weakChapters = Object.entries(chapterStats)
      .map(([name, stats]) => ({ name, accuracy: (stats.obtained / stats.total) * 100 }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    // Detailed Chapter Performance Grouped by Exam Type -> Subject -> Chapter
    const examTypePerformance: Record<string, Record<string, Record<string, any>>> = {};
    
    exams.forEach(e => {
      if (e.obtainedMarks !== undefined && e.totalMarks) {
        if (!examTypePerformance[e.examType]) examTypePerformance[e.examType] = {};
        if (!examTypePerformance[e.examType][e.subject]) examTypePerformance[e.examType][e.subject] = {};
        
        e.topics.forEach(topic => {
          if (!examTypePerformance[e.examType][e.subject][topic.name]) {
            examTypePerformance[e.examType][e.subject][topic.name] = { obtained: 0, total: 0, count: 0 };
          }
          const data = examTypePerformance[e.examType][e.subject][topic.name];
          data.obtained += e.obtainedMarks!;
          data.total += e.totalMarks!;
          data.count += 1;
        });
      }
    });

    const formattedExamTypePerformance = Object.entries(examTypePerformance).map(([type, subjects]) => ({
      type,
      subjects: Object.entries(subjects).map(([subject, chapters]) => ({
        subject,
        chapters: Object.entries(chapters).map(([chapterName, data]: [string, any]) => {
          const accuracy = (data.obtained / data.total) * 100;
          return {
            name: chapterName,
            accuracy,
            grade: calculateGrade(accuracy),
            count: data.count
          };
        })
      }))
    }));

    return { weakSubjects, weakChapters, subjectGrades, formattedExamTypePerformance };
  }, [exams]);

  const themes: { id: Theme; icon: any; label: string }[] = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'midnight', icon: Zap, label: 'Midnight' },
    { id: 'forest', icon: Palette, label: 'Forest' },
    { id: 'cyberpunk', icon: Sparkles, label: 'Cyber' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">GST FIGHT</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">by chatterjee</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-3 py-2 gap-2 border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search subjects or chapters..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-700 w-48 lg:w-64"
              />
            </div>
            
            {/* Theme Selector */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    theme === t.id 
                      ? "bg-white text-brand-600 shadow-sm border border-slate-200" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <t.icon size={18} />
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Record</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Toggle */}
        <div className="flex items-center gap-4 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
          <button
            onClick={() => setActiveSection('exams')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeSection === 'exams' 
                ? "bg-slate-900 text-white shadow-lg" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <GraduationCap size={18} />
            Exam Section
          </button>
          <button
            onClick={() => setActiveSection('curriculum')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeSection === 'curriculum' 
                ? "bg-brand-600 text-white shadow-lg shadow-brand-100" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <BookOpen size={18} />
            Curriculum Tracker
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeSection === 'exams' ? (
            <motion.div 
              key="exams"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
          {/* Left Column: Stats & AI */}
          <div className="lg:col-span-4 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                  <Clock size={20} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.upcoming}</p>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Upcoming</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <CheckCircle size={20} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</p>
              </div>
            </div>

            <ReportCard 
              overallGrade={stats.overallGrade}
              overallAccuracy={stats.avgAccuracy}
              subjectGrades={analysis.subjectGrades}
            />

            {/* Weakness Analysis Card */}
            {exams.some(e => e.obtainedMarks !== undefined) && (
              <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm bg-rose-50/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertCircle size={80} className="text-rose-500" />
                </div>
                
                <div className="flex items-center gap-2 mb-6 relative">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <AlertCircle className="text-rose-600" size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900">Weakness Analysis</h3>
                </div>
                
                <div className="space-y-6 relative">
                  {analysis.weakSubjects.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Weakest Subject</p>
                      <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm shadow-rose-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">
                            {analysis.weakSubjects[0].name[0]}
                          </div>
                          <span className="text-sm font-bold text-rose-700">{analysis.weakSubjects[0].name}</span>
                        </div>
                        <span className="text-xs font-bold text-rose-500 bg-white px-2 py-1 rounded-lg border border-rose-100">
                          {Math.round(analysis.weakSubjects[0].accuracy)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {analysis.weakChapters.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Weakest Chapters</p>
                      <div className="space-y-2">
                        {analysis.weakChapters.map(chapter => (
                          <div key={chapter.name} className="flex items-center justify-between p-3 bg-white border border-rose-100 rounded-xl hover:border-rose-300 transition-colors group">
                            <span className="text-xs font-medium text-slate-700 truncate max-w-[160px] group-hover:text-rose-600 transition-colors">{chapter.name}</span>
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                              {Math.round(chapter.accuracy)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <AIStudyBuddy exams={exams} />
            
            <ChapterReportCard performance={analysis.formattedExamTypePerformance} />
          </div>

          {/* Right Column: Exam List */}
          <div className="lg:col-span-8 space-y-8">
            <ProgressTracker 
              overallPercentage={stats.overallPercentage}
              subjectProgress={stats.subjectProgress}
              typeProgress={stats.typeProgress}
            />

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 w-fit">
                  <button 
                    onClick={() => setFilterStatus('ALL')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                      filterStatus === 'ALL' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    All Status
                  </button>
                  <button 
                    onClick={() => setFilterStatus(ExamStatus.UPCOMING)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                      filterStatus === ExamStatus.UPCOMING ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Upcoming
                  </button>
                  <button 
                    onClick={() => setFilterStatus(ExamStatus.COMPLETED)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                      filterStatus === ExamStatus.COMPLETED ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Completed
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      viewMode === 'grid' ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <LayoutGrid size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      viewMode === 'list' ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <ListIcon size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('presets')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      viewMode === 'presets' ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Zap size={20} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 w-fit">
                <button 
                  onClick={() => setFilterType('ALL')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    filterType === 'ALL' ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  All Types
                </button>
                {Object.values(ExamType).map((type) => (
                  <button 
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                      filterType === type ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {viewMode === 'presets' ? (
                <motion.div
                  key="presets"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ChapterPresets onSelect={handlePresetSelect} />
                </motion.div>
              ) : filteredExams.length > 0 ? (
                <div className={cn(
                  "grid gap-6",
                  viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                )}>
                  {filteredExams.map(exam => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      onEdit={(e) => {
                        setEditingExam(e);
                        setIsFormOpen(true);
                      }}
                      onDelete={handleDeleteExam}
                      onToggleTopic={handleToggleTopic}
                    />
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl border border-slate-200 p-12 text-center"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-slate-300" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No exams found</h3>
                  <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                    {searchQuery || filterStatus !== 'ALL' 
                      ? "Try adjusting your search or filters to find what you're looking for." 
                      : "Start by adding your first exam to track your progress and get AI study tips."}
                  </p>
                  <button 
                    onClick={() => setIsFormOpen(true)}
                    className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100"
                  >
                    <Plus size={20} />
                    Add Your First Exam
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        ) : (
          <motion.div
            key="curriculum"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CurriculumTracker 
              exams={exams}
              progress={chapterProgress}
              onToggleTask={handleToggleTask}
            />
          </motion.div>
        )}
        </AnimatePresence>
      </main>
      
      {/* Undo Toast */}
      <AnimatePresence>
        {undoState && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <p className="text-sm font-bold">{undoState.message}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Undo
                </button>
                <button
                  onClick={() => setUndoState(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isFormOpen && (
          <ExamForm
            key={editingExam?.id || 'new-exam'}
            exam={editingExam}
            onSave={handleSaveExam}
            onClose={() => {
              setIsFormOpen(false);
              setEditingExam(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
