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
  CheckCircle2,
  Clock,
  AlertCircle,
  Palette,
  Moon,
  Sun,
  Zap,
  Sparkles,
  LogOut,
  User,
  Target,
  Hash,
  Trophy,
  MoreVertical,
  X
} from 'lucide-react';
import { Auth } from './components/Auth';
import { Exam, ExamStatus, ExamType, ChapterProgress, DailyStudyRecord } from './types';
import { ExamCard } from './components/ExamCard';
import { ExamForm } from './components/ExamForm';
import { AIStudyBuddy } from './components/AIStudyBuddy';
import { ReportCard } from './components/ReportCard';
import { ChapterPresets } from './components/ChapterPresets';
import { ChapterReportCard } from './components/ChapterReportCard';
import { ProgressTracker } from './components/ProgressTracker';
import { CurriculumTracker } from './components/CurriculumTracker';
import { GSTCountdown } from './components/GSTCountdown';
import { RevisionReminders } from './components/RevisionReminders';
import { StudyTimer } from './components/StudyTimer';
import { MissionSection, MissionConfig } from './components/MissionSection';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { format, isAfter, isBefore, startOfDay, addDays } from 'date-fns';
import { NCTB_CURRICULUM, SUBJECTS, EXAM_TYPES } from './constants';

type Theme = 'light' | 'dark' | 'midnight' | 'forest' | 'cyberpunk';

export default function App() {
  const [rollNumber, setRollNumber] = useState<string | null>(localStorage.getItem('rollNumber'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));
  const [userPhone, setUserPhone] = useState<string | null>(localStorage.getItem('userPhone'));
  const [isSyncing, setIsSyncing] = useState(false);

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem(`exams_${rollNumber}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>(() => {
    const saved = localStorage.getItem(`progress_${rollNumber}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [dailyStudyTime, setDailyStudyTime] = useState<Record<string, DailyStudyRecord>>(() => {
    const saved = localStorage.getItem(`studyTime_${rollNumber}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [missionConfig, setMissionConfig] = useState<MissionConfig | null>(() => {
    const saved = localStorage.getItem(`mission_${rollNumber}`);
    return saved ? JSON.parse(saved) : null;
  });

  // Load data when roll number changes
  useEffect(() => {
    if (rollNumber) {
      const savedExams = localStorage.getItem(`exams_${rollNumber}`);
      const savedProgress = localStorage.getItem(`progress_${rollNumber}`);
      const savedStudyTime = localStorage.getItem(`studyTime_${rollNumber}`);
      const savedMission = localStorage.getItem(`mission_${rollNumber}`);
      setExams(savedExams ? JSON.parse(savedExams) : []);
      setChapterProgress(savedProgress ? JSON.parse(savedProgress) : []);
      setDailyStudyTime(savedStudyTime ? JSON.parse(savedStudyTime) : {});
      setMissionConfig(savedMission ? JSON.parse(savedMission) : null);
    }
  }, [rollNumber]);

  // Save to localStorage
  useEffect(() => {
    if (rollNumber) {
      localStorage.setItem(`exams_${rollNumber}`, JSON.stringify(exams));
      localStorage.setItem(`progress_${rollNumber}`, JSON.stringify(chapterProgress));
      localStorage.setItem(`studyTime_${rollNumber}`, JSON.stringify(dailyStudyTime));
      localStorage.setItem(`mission_${rollNumber}`, JSON.stringify(missionConfig));
    }
  }, [exams, chapterProgress, dailyStudyTime, missionConfig, rollNumber]);

  const handleLogin = (roll: string, name: string, phone: string, remember: boolean) => {
    setRollNumber(roll);
    setUserName(name);
    setUserPhone(phone);
    if (remember) {
      localStorage.setItem('rollNumber', roll);
      localStorage.setItem('userName', name);
      localStorage.setItem('userPhone', phone);
    }
  };

  const handleLogout = () => {
    setRollNumber(null);
    setUserName(null);
    setUserPhone(null);
    localStorage.removeItem('rollNumber');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    setExams([]);
    setChapterProgress([]);
    setDailyStudyTime({});
    setMissionConfig(null);
  };

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
  const [activeSection, setActiveSection] = useState<'home' | 'exams' | 'curriculum' | 'timer' | 'mission' | 'profile'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Removed local storage effects as we use server sync now

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'midnight', 'forest', 'cyberpunk'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

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


  // Automated Revision Scheduling
  useEffect(() => {
    const timer = setTimeout(() => {
      setChapterProgress(prev => {
        let changed = false;
        const next = prev.map(p => {
          const chapterExams = exams.filter(e => 
            e.subject === p.subject && 
            e.status === ExamStatus.COMPLETED &&
            e.topics.some(t => t.name === p.chapterName)
          );
          const hasTakenExam = chapterExams.length > 0;
          const isFullyDone = p.isClassDone && p.isUniQBDone && p.isGSTQBDone;
          const isCompleted = isFullyDone && hasTakenExam;

          let updated = { ...p };
          let localChanged = false;

          // Schedule 1st revision if completed
          if (isCompleted && !updated.completedAt) {
            updated.completedAt = new Date().toISOString();
            updated.scheduledFirstRevisionAt = addDays(new Date(), 3).toISOString();
            localChanged = true;
          } else if (!isCompleted && updated.completedAt) {
            updated.completedAt = undefined;
            updated.scheduledFirstRevisionAt = undefined;
            updated.scheduledSecondRevisionAt = undefined;
            localChanged = true;
          }

          // Schedule 2nd revision if 1st is done
          if (updated.firstRevisionAt && !updated.scheduledSecondRevisionAt) {
            updated.scheduledSecondRevisionAt = addDays(new Date(updated.firstRevisionAt), 7).toISOString();
            localChanged = true;
          } else if (!updated.firstRevisionAt && updated.scheduledSecondRevisionAt) {
            updated.scheduledSecondRevisionAt = undefined;
            localChanged = true;
          }

          if (localChanged) changed = true;
          return updated;
        });

        return changed ? next : prev;
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [exams, chapterProgress.length]);

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
        const isChapterExam = [ExamType.V_QB, ExamType.GST_QB, ExamType.PH_EXAM].includes(e.examType);
        if (isChapterExam) {
          e.topics.forEach(t => {
            coveredChaptersSet.add(`${e.subject}-${t.name}`);
            subjectCoveredChapters[e.subject]?.add(t.name);
            if (!typeCoveredChapters[e.examType]) typeCoveredChapters[e.examType] = new Set();
            typeCoveredChapters[e.examType]?.add(t.name);
          });
        }
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

    const typeProgress = [ExamType.V_QB, ExamType.GST_QB, ExamType.PH_EXAM].map(type => {
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

  const MOTIVATIONAL_QUOTES = [
    "The main problem is that you think you have time",
    "The pain of discipline is way better than the pain of regret",
    "GST is the last chance you have for a better future, you gotta nail it to secure a better future for you and your family",
    "Just do it",
    "Krishna said work hard, that's all you have to do, do not think about the outcome that the thing only God himself will decide",
    "Just pray and grind hard"
  ];

  const MotivationalQuotes = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      }, 6000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="h-32 flex items-center justify-center text-center px-6 bg-white/40 backdrop-blur-sm rounded-[2rem] border border-white/20 shadow-inner mb-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-lg md:text-xl font-black text-slate-800 italic leading-relaxed max-w-3xl"
          >
            "{MOTIVATIONAL_QUOTES[index]}"
          </motion.p>
        </AnimatePresence>
      </div>
    );
  };

  if (!rollNumber) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 transition-colors duration-300">
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => { setActiveSection('home'); setIsMenuOpen(false); }}
                >
                  <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
                    <Target className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">GST FIGHT</h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <button
                    onClick={() => { setActiveSection('home'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                      activeSection === 'home' ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <LayoutGrid size={20} />
                    Home
                  </button>
                  <button
                    onClick={() => { setActiveSection('exams'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                      activeSection === 'exams' ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <GraduationCap size={20} />
                    Exam Section
                  </button>
                  <button
                    onClick={() => { setActiveSection('curriculum'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                      activeSection === 'curriculum' ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <BookOpen size={20} />
                    Curriculum Tracker
                  </button>
                  <button
                    onClick={() => { setActiveSection('timer'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                      activeSection === 'timer' ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Clock size={20} />
                    Study Timer
                  </button>
                  <button
                    onClick={() => { setActiveSection('mission'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                      activeSection === 'mission' ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Target size={20} />
                    Mission
                  </button>
                  <button
                    onClick={() => { setActiveSection('profile'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                      activeSection === 'profile' ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <User size={20} />
                    Profile
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <MoreVertical size={24} />
            </button>
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setActiveSection('home')}
            >
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
                <Target className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">GST FIGHT</h1>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">by soumya</p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden lg:flex items-center justify-center">
            <div className="flex items-center gap-2 px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
              <Hash size={14} className="text-brand-600" />
              <span className="text-sm font-black text-slate-700 tracking-wider">ROLL: {rollNumber}</span>
              {isSyncing && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-2" />}
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
            
            <button 
              onClick={cycleTheme}
              className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
              title="Cycle Theme"
            >
              <Palette size={20} />
            </button>

            <button 
              onClick={() => setActiveSection('profile')}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                activeSection === 'profile' ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
              title="Profile"
            >
              <User size={20} />
            </button>

            <button 
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeSection === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Welcome back, <span className="text-brand-600">{userName?.split(' ')[0]}</span>!
                </h2>
                <p className="text-slate-500 font-medium mt-1">Ready to conquer your GST goals today?</p>
              </div>
              <MotivationalQuotes />
              <GSTCountdown progress={chapterProgress} exams={exams} />
            </motion.div>
          ) : activeSection === 'timer' ? (
            <motion.div
              key="timer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <StudyTimer 
                dailyStudyTime={dailyStudyTime} 
                onUpdateStudyTime={(date, record) => {
                  setDailyStudyTime(prev => ({ ...prev, [date]: record }));
                }} 
              />
            </motion.div>
          ) : activeSection === 'exams' ? (
            <motion.div 
              key="exams"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Exam Section</h2>
                <button 
                  onClick={() => setIsFormOpen(true)}
                  className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Add Record</span>
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Stats & AI */}
                <div className="lg:col-span-4 space-y-8">
                <RevisionReminders 
                  progress={chapterProgress} 
                  exams={exams} 
                  onChapterClick={(subject, chapter) => {
                    setActiveSection('curriculum');
                  }}
                />

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

                <AIStudyBuddy exams={exams} userName={userName || 'Student'} />
                
                <ChapterReportCard performance={analysis.formattedExamTypePerformance} />
              </div>

              {/* Right Column: Exam List */}
              <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-slate-900">Exam Records</h2>
                </div>
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
              </div>
            </motion.div>
          ) : activeSection === 'curriculum' ? (
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
          ) : activeSection === 'mission' ? (
            <MissionSection 
              missionConfig={missionConfig}
              setMissionConfig={setMissionConfig}
              dailyStudyTime={dailyStudyTime}
            />
          ) : (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-[2.5rem] p-12 shadow-xl shadow-slate-200 border border-slate-100">
                <div className="text-center mb-10">
                  <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                    <User className="text-brand-600" size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{userName}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">GST Admission Candidate</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Roll Number</p>
                      <p className="text-xl font-black text-slate-900">{rollNumber}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                      <p className="text-xl font-black text-slate-900">{userPhone}</p>
                    </div>
                  </div>

                  <div className="p-8 bg-brand-600 rounded-3xl text-white shadow-lg shadow-brand-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Trophy size={24} />
                        <h3 className="text-lg font-black">Performance Summary</h3>
                      </div>
                      <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Admission 2026</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-black">{exams.length}</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Exams Taken</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-black">
                          {exams.length > 0 ? (exams.reduce((acc, e) => acc + (e.obtainedMarks || 0), 0) / exams.length).toFixed(1) : '0.0'}
                        </p>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Avg Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-black">
                          {Math.round((chapterProgress.filter(p => p.isClassDone && p.isUniQBDone && p.isGSTQBDone).length / Object.values(NCTB_CURRICULUM).flat().length) * 100)}%
                        </p>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Syllabus Done</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Palette size={18} className="text-brand-600" />
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Appearance</h3>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { id: 'light', icon: Sun, label: 'Light' },
                        { id: 'dark', icon: Moon, label: 'Dark' },
                        { id: 'midnight', icon: Sparkles, label: 'Night' },
                        { id: 'forest', icon: Palette, label: 'Forest' },
                        { id: 'cyberpunk', icon: Zap, label: 'Cyber' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as Theme)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                            theme === t.id 
                              ? "bg-brand-50 border-brand-600 text-brand-600 shadow-sm" 
                              : "bg-slate-50 border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600"
                          )}
                        >
                          <t.icon size={20} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setActiveSection('exams')}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      Back to Exams
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all border border-rose-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
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
