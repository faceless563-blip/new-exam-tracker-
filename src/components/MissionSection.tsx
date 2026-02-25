import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Clock, Calendar, ArrowRight, CheckCircle2, AlertCircle, Zap, Flame, Trophy, Star, Crown, Sparkles } from 'lucide-react';
import { differenceInDays, parseISO, format, differenceInMilliseconds, addDays, subDays, isBefore } from 'date-fns';
import { DailyStudyRecord } from '../types';
import { cn } from '../lib/utils';
import { NCTB_CURRICULUM } from '../constants';

export type MissionType = 'HOURS' | 'CHAPTERS';

export interface MissionConfig {
  type?: MissionType;
  totalDays: number;
  startDate: string;
  isReady: boolean;
  
  // For HOURS mission
  totalHours?: number;
  targetHoursPerDay?: number;
  trackingMethod?: 'MANUAL' | 'AUTOMATIC';
  manualStudyLogs?: Record<string, number>; // dateStr -> seconds

  // For CHAPTERS mission
  totalChapters?: number;
  targetChaptersPerDay?: number;
  selectedChapters?: { subject: string; chapter: string }[];
  completedChapters?: { subject: string; chapter: string; date: string }[];
  dailyTodos?: Record<string, { subject: string; chapter: string }[]>;
}

interface MissionSectionProps {
  missionConfig: MissionConfig | null;
  setMissionConfig: (config: MissionConfig | null) => void;
  dailyStudyTime: Record<string, DailyStudyRecord>;
}

export const MissionSection: React.FC<MissionSectionProps> = ({
  missionConfig,
  setMissionConfig,
  dailyStudyTime
}) => {
  const [step, setStep] = useState<'welcome' | 'options' | 'setup' | 'setup_chapters' | 'summary'>(
    missionConfig?.isReady ? 'summary' : 'welcome'
  );

  const [totalHours, setTotalHours] = useState(missionConfig?.totalHours || 500);
  const [totalDays, setTotalDays] = useState(missionConfig?.totalDays || 60);
  const [startDate, setStartDate] = useState(missionConfig?.startDate || format(new Date(), 'yyyy-MM-dd'));
  const [trackingMethod, setTrackingMethod] = useState<'MANUAL' | 'AUTOMATIC'>(
    missionConfig?.trackingMethod || 'AUTOMATIC'
  );

  // Chapter Mission State
  const [totalChapters, setTotalChapters] = useState(missionConfig?.totalChapters || 10);
  const [selectedChapters, setSelectedChapters] = useState<{ subject: string; chapter: string }[]>(
    missionConfig?.selectedChapters || []
  );
  const [isEditingTodo, setIsEditingTodo] = useState(false);

  const targetHoursPerDay = useMemo(() => {
    if (totalDays <= 0) return 0;
    return Number((totalHours / totalDays).toFixed(1));
  }, [totalHours, totalDays]);

  const [now, setNow] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeRemaining = useMemo(() => {
    if (!missionConfig) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const startDateObj = parseISO(missionConfig.startDate);
    const endDateObj = addDays(startDateObj, missionConfig.totalDays);
    
    // If mission hasn't started, countdown starts from total duration
    if (isBefore(now, startDateObj)) {
      return {
        days: missionConfig.totalDays,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
    }

    const diff = differenceInMilliseconds(endDateObj, now);
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }, [missionConfig, now]);

  const handleReady = () => {
    setMissionConfig({
      type: 'HOURS',
      totalHours,
      totalDays,
      startDate,
      targetHoursPerDay,
      trackingMethod,
      manualStudyLogs: {},
      isReady: true
    });
    setStep('summary');
  };

  const handleReadyChapters = () => {
    setMissionConfig({
      type: 'CHAPTERS',
      totalDays,
      startDate,
      totalChapters: selectedChapters.length,
      targetChaptersPerDay: Math.ceil(selectedChapters.length / totalDays),
      selectedChapters,
      completedChapters: [],
      isReady: true
    });
    setStep('summary');
  };

  const renderWelcome = () => (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200 border border-slate-100 text-center max-w-2xl mx-auto"
    >
      <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Target className="text-brand-600" size={48} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
        Hi! Welcome to the Mission section of GST Fight.
      </h2>
      <p className="text-lg text-slate-500 font-medium mb-8">
        Here you can customize your study mission and track your daily progress towards your ultimate goal.
      </p>
      <button
        onClick={() => setStep('options')}
        className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 hover:scale-105 active:scale-95"
      >
        Next <ArrowRight size={20} />
      </button>
    </motion.div>
  );

  const renderOptions = () => (
    <motion.div
      key="options"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8 text-center">Choose Your Mission</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setStep('setup')}
          className="bg-white p-8 rounded-[2rem] border-2 border-brand-100 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-100 transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-6 text-brand-600 group-hover:scale-110 transition-transform">
              <Clock size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Study Hour Mission</h3>
            <p className="text-slate-500 font-medium mb-6">
              Set a daily study hour target, track your time, and get adaptive feedback to stay on course.
            </p>
            <span className="text-brand-600 font-bold flex items-center gap-2">
              Select Mission <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </button>
        
        <button
          onClick={() => setStep('setup_chapters')}
          className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-100 transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-6 text-slate-500 group-hover:scale-110 transition-transform group-hover:bg-brand-100 group-hover:text-brand-600">
              <Zap size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Chapter Mastery</h3>
            <p className="text-slate-500 font-medium mb-6">
              Focus on completing specific chapters. Select chapters and set a deadline.
            </p>
            <span className="text-slate-400 font-bold flex items-center gap-2 group-hover:text-brand-600">
              Select Mission <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </button>
      </div>
    </motion.div>
  );

  const renderSetup = () => (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200 border border-slate-100"
    >
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setStep('options')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
        >
          <ArrowRight size={24} className="rotate-180" />
        </button>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Setup Mission</h2>
      </div>

      <div className="space-y-6 mb-10">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Total Mission Hours</label>
          <input 
            type="number" 
            min="1" 
            value={totalHours}
            onChange={(e) => setTotalHours(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-lg font-bold text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">In How Many Days?</label>
          <input 
            type="number" 
            min="1" 
            value={totalDays}
            onChange={(e) => setTotalDays(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-lg font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Start Date</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-lg font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">How do you want to track your time?</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setTrackingMethod('AUTOMATIC')}
              className={cn(
                "p-4 rounded-2xl border-2 text-left transition-all",
                trackingMethod === 'AUTOMATIC' 
                  ? "border-brand-500 bg-brand-50" 
                  : "border-slate-200 hover:border-brand-200"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  trackingMethod === 'AUTOMATIC' ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  <Clock size={16} />
                </div>
                <span className="font-bold text-slate-900">In-App Timer</span>
              </div>
              <p className="text-sm text-slate-500">We will automatically track your study hours using the built-in timer.</p>
            </button>
            <button
              onClick={() => setTrackingMethod('MANUAL')}
              className={cn(
                "p-4 rounded-2xl border-2 text-left transition-all",
                trackingMethod === 'MANUAL' 
                  ? "border-brand-500 bg-brand-50" 
                  : "border-slate-200 hover:border-brand-200"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  trackingMethod === 'MANUAL' ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  <Target size={16} />
                </div>
                <span className="font-bold text-slate-900">Manual Entry</span>
              </div>
              <p className="text-sm text-slate-500">You manually log your hours each day. This is about your own accountability now!</p>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-brand-50 rounded-2xl p-6 mb-8 border border-brand-100">
        <h3 className="font-bold text-brand-900 mb-2">Mission Summary</h3>
        <p className="text-brand-700 text-lg">
          To complete <span className="font-black">{totalHours} hours</span> in <span className="font-black">{totalDays} days</span>, you have to study <span className="font-black">{targetHoursPerDay} hours a day</span>. Are you ready?
        </p>
      </div>

      <button
        onClick={handleReady}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-95 text-lg"
      >
        <Flame size={24} className="text-brand-400" />
        Ready
      </button>
    </motion.div>
  );

  const renderSetupChapters = () => {
    const toggleChapter = (subject: string, chapter: string) => {
      setSelectedChapters(prev => {
        const exists = prev.find(p => p.subject === subject && p.chapter === chapter);
        if (exists) {
          return prev.filter(p => !(p.subject === subject && p.chapter === chapter));
        } else {
          return [...prev, { subject, chapter }];
        }
      });
    };

    return (
      <motion.div
        key="setup_chapters"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200 border border-slate-100"
      >
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setStep('options')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowRight size={24} className="rotate-180" />
          </button>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Setup Chapter Mission</h2>
        </div>

        <div className="space-y-6 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">In How Many Days?</label>
              <input 
                type="number" 
                min="1" 
                value={totalDays}
                onChange={(e) => setTotalDays(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-lg font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Select Chapters to Complete</label>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
              {Object.entries(NCTB_CURRICULUM).map(([subject, chapters]) => (
                <div key={subject} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3">{subject}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {chapters.map(chapter => {
                      const isSelected = selectedChapters.some(c => c.subject === subject && c.chapter === chapter);
                      return (
                        <button
                          key={chapter}
                          onClick={() => toggleChapter(subject, chapter)}
                          className={cn(
                            "text-left px-3 py-2 rounded-xl text-sm transition-all border",
                            isSelected 
                              ? "bg-brand-100 border-brand-300 text-brand-800 font-bold" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-brand-200"
                          )}
                        >
                          {chapter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-brand-50 rounded-2xl p-6 mb-8 border border-brand-100">
          <h3 className="font-bold text-brand-900 mb-2">Mission Summary</h3>
          <p className="text-brand-700 text-lg">
            To complete <span className="font-black">{selectedChapters.length} chapters</span> in <span className="font-black">{totalDays} days</span>, you have to complete <span className="font-black">{Math.ceil(selectedChapters.length / totalDays)} chapters a day</span>. Are you ready?
          </p>
        </div>

        <button
          onClick={handleReadyChapters}
          disabled={selectedChapters.length === 0 || totalDays <= 0}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-95 text-lg disabled:opacity-50 disabled:pointer-events-none"
        >
          <Flame size={24} className="text-brand-400" />
          Ready
        </button>
      </motion.div>
    );
  };

  const renderDashboard = () => {
    if (!missionConfig) return null;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const startDateObj = parseISO(missionConfig.startDate);
    const daysPassed = Math.max(0, differenceInDays(now, startDateObj));
    const isChaptersMission = missionConfig.type === 'CHAPTERS';

    let progressPct = 0;
    let isGoalMet = false;
    let overallProgressPct = 0;
    let totalMissionHoursStudied = 0;
    let totalMissionChaptersCompleted = 0;
    let currentStreak = 0;
    let feedbackMessage = "";
    let feedbackType: 'positive' | 'warning' | 'neutral' = 'neutral';
    let todayHours = 0;
    let completedToday = 0;

    if (isChaptersMission) {
      const completed = missionConfig.completedChapters || [];
      const todayTodos = missionConfig.dailyTodos?.[todayStr] || [];
      
      completedToday = todayTodos.filter(todo => 
        completed.some(c => c.subject === todo.subject && c.chapter === todo.chapter)
      ).length;
      
      const target = missionConfig.targetChaptersPerDay || 1;
      
      if (todayTodos.length > 0) {
        progressPct = Math.min((completedToday / todayTodos.length) * 100, 100);
      } else {
        progressPct = 0;
      }
      
      isGoalMet = completedToday >= target;
      
      totalMissionChaptersCompleted = completed.length;
      overallProgressPct = Math.min((totalMissionChaptersCompleted / (missionConfig.totalChapters || 1)) * 100, 100);

      // Streak Calculation
      let checkDate = now;
      if (isGoalMet) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else if (completedToday > 0) {
        checkDate = subDays(checkDate, 1);
      } else {
        checkDate = subDays(checkDate, 1);
      }
      while (true) {
        if (isBefore(checkDate, startDateObj)) break;
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        const pastTodos = missionConfig.dailyTodos?.[dateStr] || [];
        const completedOnDate = pastTodos.filter(todo => 
          completed.some(c => c.subject === todo.subject && c.chapter === todo.chapter)
        ).length;
        if (completedOnDate >= pastTodos.length && pastTodos.length > 0) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      const expectedTotalCompleted = (daysPassed + 1) * target;
      const deficit = Math.max(0, expectedTotalCompleted - totalMissionChaptersCompleted);
      const nextDayTarget = Math.ceil(target + deficit);
      const isTodoDone = completedToday >= todayTodos.length && todayTodos.length > 0;

      if (todayTodos.length === 0) {
        feedbackMessage = "Your daily mission board is empty. Plan your day to start earning XP!";
        feedbackType = 'neutral';
      } else if (deficit > 0) {
        if (isTodoDone) {
          feedbackMessage = `Incredible work clearing today's list! 🌟 You're still slightly behind overall, so try to tackle ${nextDayTarget} chapters tomorrow.`;
          feedbackType = 'positive';
        } else {
          feedbackMessage = `You're falling a bit behind your master plan. No worries—focus up and aim for ${nextDayTarget} chapters tomorrow to catch up! 💪`;
          feedbackType = 'warning';
        }
      } else if (isGoalMet || isTodoDone) {
        feedbackMessage = "Mission Accomplished! 🎉 You've crushed your daily targets. Take a well-deserved break!";
        feedbackType = 'positive';
      } else if (completedToday > 0) {
        feedbackMessage = `Awesome! You've checked off ${completedToday} chapter${completedToday > 1 ? 's' : ''} today. Keep that momentum going! 🔥`;
        feedbackType = 'positive';
      } else {
        feedbackMessage = "Ready to conquer the day? Pick your first chapter and let's get this bread! 🚀";
        feedbackType = 'neutral';
      }
    } else {
      const isManual = missionConfig.trackingMethod === 'MANUAL';
      
      if (isManual) {
        const manualSeconds = missionConfig.manualStudyLogs?.[todayStr] || 0;
        todayHours = manualSeconds / 3600;
      } else {
        const todayRecord = dailyStudyTime[todayStr];
        const todaySeconds = todayRecord ? todayRecord.total : 0;
        todayHours = todaySeconds / 3600;
      }
      
      const target = missionConfig.targetHoursPerDay || 1;
      
      progressPct = Math.min((todayHours / target) * 100, 100);
      isGoalMet = todayHours >= target;
      overallProgressPct = Math.min((daysPassed / missionConfig.totalDays) * 100, 100);

      if (isManual) {
        Object.entries(missionConfig.manualStudyLogs || {}).forEach(([dateStr, seconds]) => {
          if (!isBefore(parseISO(dateStr), startDateObj)) {
            totalMissionHoursStudied += seconds / 3600;
          }
        });
      } else {
        Object.entries(dailyStudyTime).forEach(([dateStr, record]) => {
          if (!isBefore(parseISO(dateStr), startDateObj)) {
            totalMissionHoursStudied += (record.total || 0) / 3600;
          }
        });
      }

      // Streak Calculation
      let checkDate = now;
      if (isGoalMet) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else if (todayHours > 0) {
        checkDate = subDays(checkDate, 1);
      } else {
        checkDate = subDays(checkDate, 1);
      }
      while (true) {
        if (isBefore(checkDate, startDateObj)) break;
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        let hours = 0;
        if (isManual) {
          hours = (missionConfig.manualStudyLogs?.[dateStr] || 0) / 3600;
        } else {
          hours = (dailyStudyTime[dateStr]?.total || 0) / 3600;
        }
        if (hours >= target) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      if (todayHours === 0) {
        feedbackMessage = "Ready to conquer the day? Start your timer and let's get this bread! 🚀";
        feedbackType = 'neutral';
      } else if (isGoalMet) {
        feedbackMessage = "Mission Accomplished! 🎉 You've crushed your daily target. Take a well-deserved break!";
        feedbackType = 'positive';
      } else if (progressPct >= 50) {
        feedbackMessage = "Awesome progress! You're more than halfway there. Push through, you've got this! 🔥";
        feedbackType = 'positive';
      } else {
        feedbackMessage = "You've made a start! Eliminate distractions and keep focusing to hit your target. 💪";
        feedbackType = 'neutral';
      }
    }

    // Level System
    const xp = isChaptersMission ? totalMissionChaptersCompleted * 500 : Math.floor(totalMissionHoursStudied * 100);
    const currentLevel = isChaptersMission ? Math.floor(totalMissionChaptersCompleted / 2) + 1 : Math.floor(totalMissionHoursStudied / 5) + 1;
    const xpForNextLevel = isChaptersMission ? currentLevel * 2 * 500 : currentLevel * 5 * 100;
    const xpForCurrentLevel = isChaptersMission ? (currentLevel - 1) * 2 * 500 : (currentLevel - 1) * 5 * 100;
    const levelProgress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    const getRankName = (level: number) => {
      if (level < 5) return "Novice Scholar";
      if (level < 10) return "Focus Apprentice";
      if (level < 20) return "Study Warrior";
      if (level < 30) return "Knowledge Master";
      return "Grandmaster of Focus";
    };

    const toggleChapterDone = (subject: string, chapter: string) => {
      if (!missionConfig) return;
      const completed = missionConfig.completedChapters || [];
      const exists = completed.find(c => c.subject === subject && c.chapter === chapter);
      let newCompleted;
      if (exists) {
        newCompleted = completed.filter(c => !(c.subject === subject && c.chapter === chapter));
      } else {
        newCompleted = [...completed, { subject, chapter, date: todayStr }];
      }
      setMissionConfig({ ...missionConfig, completedChapters: newCompleted });
    };

    const toggleTodo = (subject: string, chapter: string) => {
      if (!missionConfig) return;
      const currentTodos = missionConfig.dailyTodos?.[todayStr] || [];
      const exists = currentTodos.find(c => c.subject === subject && c.chapter === chapter);
      let newTodos;
      if (exists) {
        newTodos = currentTodos.filter(c => !(c.subject === subject && c.chapter === chapter));
      } else {
        newTodos = [...currentTodos, { subject, chapter }];
      }
      setMissionConfig({
        ...missionConfig,
        dailyTodos: {
          ...(missionConfig.dailyTodos || {}),
          [todayStr]: newTodos
        }
      });
    };

    return (
      <motion.div
        key="dashboard"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mission Dashboard</h2>
            <p className="text-slate-500 font-medium mt-1">
              {isChaptersMission ? "Track your chapter completion mission." : "Track your daily study hour mission."}
            </p>
          </div>
          <button 
            onClick={() => {
              setMissionConfig(null);
              setStep('welcome');
            }}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Reset Mission
          </button>
        </div>

        {/* Gamification Header */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-[2.5rem] p-8 border border-brand-500 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-inner shrink-0">
              {currentLevel >= 30 ? <Crown size={40} className="text-amber-300" /> : 
               currentLevel >= 10 ? <Star size={40} className="text-amber-300" /> : 
               <Trophy size={40} className="text-amber-300" />}
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 gap-2">
                <div>
                  <p className="text-brand-200 font-bold uppercase tracking-widest text-xs mb-1">Current Rank</p>
                  <h3 className="text-2xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                    {getRankName(currentLevel)}
                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">Lv. {currentLevel}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-brand-200 font-bold text-sm">{xp} / {xpForNextLevel} XP</p>
                </div>
              </div>
              <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/10 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBsNDAtNDBIMjBMMCAyMHptNDAgMEwyMCA0MGgyMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjIiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
                </motion.div>
              </div>
              <p className="text-xs text-brand-200 mt-2 font-medium">
                {isChaptersMission ? "Earn 500 XP for every chapter completed. Keep pushing!" : "Earn 100 XP for every hour studied. Keep pushing!"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                <Flame size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Streak</p>
              <p className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                {currentStreak} <span className="text-lg text-slate-500 font-medium">days</span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                <Clock size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {isChaptersMission ? "Chapters Today" : "Studied Today"}
              </p>
              <p className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                {isChaptersMission ? completedToday : todayHours.toFixed(1)} <span className="text-lg text-slate-500 font-medium">/ {isChaptersMission ? missionConfig.targetChaptersPerDay : missionConfig.targetHoursPerDay} {isChaptersMission ? 'ch' : 'hrs'}</span>
              </p>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-purple-600">
                <Calendar size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {isChaptersMission ? "Total Chapters" : "Total Studied"}
              </p>
              <p className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                {isChaptersMission ? totalMissionChaptersCompleted : totalMissionHoursStudied.toFixed(1)} <span className="text-lg text-slate-500 font-medium">/ {isChaptersMission ? missionConfig.totalChapters : missionConfig.totalHours} {isChaptersMission ? 'ch' : 'hrs'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {isBefore(now, startDateObj) ? "Mission Pending" : "Mission Active"}
                </h3>
                <p className="text-sm text-slate-400">
                  {isBefore(now, startDateObj) 
                    ? `Starts on ${format(startDateObj, 'MMMM d, yyyy')}` 
                    : "Time remaining to complete your mission"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center bg-white/5 rounded-xl p-3 min-w-[70px] border border-white/5">
                  <motion.span 
                    animate={isBefore(now, startDateObj) ? {} : { scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-2xl font-black text-brand-400"
                  >
                    {timeRemaining.days.toString().padStart(2, '0')}
                  </motion.span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Days</span>
                </div>
                <span className="text-xl font-black text-white/20">:</span>
                <div className="flex flex-col items-center bg-white/5 rounded-xl p-3 min-w-[70px] border border-white/5">
                  <span className="text-2xl font-black text-white">{timeRemaining.hours.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Hours</span>
                </div>
                <span className="text-xl font-black text-white/20">:</span>
                <div className="flex flex-col items-center bg-white/5 rounded-xl p-3 min-w-[70px] border border-white/5">
                  <span className="text-2xl font-black text-white">{timeRemaining.minutes.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Mins</span>
                </div>
                <span className="text-xl font-black text-white/20">:</span>
                <div className="flex flex-col items-center bg-white/5 rounded-xl p-3 min-w-[70px] border border-white/5">
                  <motion.span 
                    animate={isBefore(now, startDateObj) ? {} : { opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-2xl font-black text-brand-400"
                  >
                    {timeRemaining.seconds.toString().padStart(2, '0')}
                  </motion.span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Secs</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">Overall Progress</span>
                  <span className="text-sm font-black text-brand-400">{Math.round(overallProgressPct)}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgressPct}%` }}
                    className="h-full bg-gradient-to-r from-brand-600 to-brand-400"
                  />
                </div>
              </div>

              {!isBefore(now, startDateObj) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-300">Time Elapsed</span>
                    <span className="text-sm font-black text-blue-400">
                      {Math.round(Math.min((daysPassed / missionConfig.totalDays) * 100, 100))}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((daysPassed / missionConfig.totalDays) * 100, 100)}%` }}
                      className="h-full bg-blue-500/50"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-400 text-right mt-1">{daysPassed} of {missionConfig.totalDays} days completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          {isGoalMet && (
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="absolute top-10 right-10 text-amber-400"
              >
                <Sparkles size={40} />
              </motion.div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-xl font-bold text-slate-900">Today's Progress</h3>
            <span className="text-2xl font-black text-brand-600">{Math.round(progressPct)}%</span>
          </div>
          {isChaptersMission && (missionConfig.dailyTodos?.[todayStr] || []).length > 0 ? (
            <div className="flex items-center gap-2 mb-8 relative z-10">
              {(missionConfig.dailyTodos?.[todayStr] || []).map((todo, idx) => {
                const isDone = (missionConfig.completedChapters || []).some(
                  c => c.subject === todo.subject && c.chapter === todo.chapter
                );
                return (
                  <div key={idx} className="flex-1 h-8 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: isDone ? '100%' : '0%' }}
                      className={cn(
                        "h-full transition-all duration-700 flex items-center justify-center relative overflow-hidden",
                        isDone ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-transparent"
                      )}
                    >
                      {isDone && (
                        <>
                          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBsNDAtNDBIMjBMMCAyMHptNDAgMEwyMCA0MGgyMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjIiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30" />
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                            className="relative z-10"
                          >
                            <CheckCircle2 size={18} className="text-white drop-shadow-md" />
                          </motion.div>
                        </>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-6 bg-slate-100 rounded-full overflow-hidden mb-8 border border-slate-200 p-1 relative z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-1000 relative overflow-hidden",
                  isGoalMet ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-brand-500"
                )}
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBsNDAtNDBIMjBMMCAyMHptNDAgMEwyMCA0MGgyMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjIiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30" />
              </motion.div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div 
              key={feedbackMessage}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={cn(
              "rounded-3xl p-6 flex items-start gap-5 border-2 relative z-10 mb-8 shadow-sm",
              feedbackType === 'positive' ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100" :
              feedbackType === 'warning' ? "bg-gradient-to-br from-orange-50 to-rose-50 border-orange-100" :
              "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                feedbackType === 'positive' ? "bg-emerald-500 text-white shadow-emerald-200" :
                feedbackType === 'warning' ? "bg-orange-500 text-white shadow-orange-200" :
                "bg-indigo-500 text-white shadow-indigo-200"
              )}>
                {feedbackType === 'positive' ? <Sparkles size={24} /> :
                 feedbackType === 'warning' ? <Flame size={24} /> :
                 <Zap size={24} />}
              </div>
              <div className="flex-1 pt-1">
                <h4 className={cn(
                  "text-sm font-black uppercase tracking-widest mb-1.5",
                  feedbackType === 'positive' ? "text-emerald-600" :
                  feedbackType === 'warning' ? "text-orange-600" :
                  "text-indigo-600"
                )}>Mission Intel</h4>
                <p className={cn(
                  "text-base font-medium leading-relaxed",
                  feedbackType === 'positive' ? "text-emerald-900" :
                  feedbackType === 'warning' ? "text-orange-900" :
                  "text-indigo-900"
                )}>{feedbackMessage}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {!isChaptersMission && missionConfig.trackingMethod === 'MANUAL' && (
            <div className="mt-8 pt-8 border-t border-slate-100 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Log Study Time</h3>
                  <p className="text-sm text-slate-500">Manually record your hours for today</p>
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hours</label>
                    <input 
                      type="number" 
                      min="0"
                      max="24"
                      placeholder="0"
                      id="manual-hours"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-lg font-bold text-slate-900 text-center"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Minutes</label>
                    <input 
                      type="number" 
                      min="0"
                      max="59"
                      placeholder="0"
                      id="manual-minutes"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-lg font-bold text-slate-900 text-center"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const hoursInput = document.getElementById('manual-hours') as HTMLInputElement;
                    const minsInput = document.getElementById('manual-minutes') as HTMLInputElement;
                    const h = parseInt(hoursInput.value || '0', 10);
                    const m = parseInt(minsInput.value || '0', 10);
                    const totalSeconds = (h * 3600) + (m * 60);
                    
                    if (totalSeconds > 0) {
                      setMissionConfig({
                        ...missionConfig,
                        manualStudyLogs: {
                          ...(missionConfig.manualStudyLogs || {}),
                          [todayStr]: (missionConfig.manualStudyLogs?.[todayStr] || 0) + totalSeconds
                        }
                      });
                      hoursInput.value = '';
                      minsInput.value = '';
                    }
                  }}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Log Time
                </button>
              </div>
            </div>
          )}

          {isChaptersMission && missionConfig.selectedChapters && (
            <div className="mt-8 pt-8 border-t border-slate-100 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Today's To-Do List</h3>
                  <p className="text-sm text-slate-500">{format(now, 'EEEE, MMMM d')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsEditingTodo(!isEditingTodo)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    {isEditingTodo ? "Done Editing" : "Edit List"}
                  </button>
                  <div className="bg-brand-50 text-brand-600 px-3 py-2 rounded-xl text-sm font-bold">
                    {completedToday} / {missionConfig.dailyTodos?.[todayStr]?.length || 0} Target
                  </div>
                </div>
              </div>
              
              {isEditingTodo ? (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Select chapters for today</p>
                  {missionConfig.selectedChapters.filter(ch => 
                    !(missionConfig.completedChapters || []).some(c => c.subject === ch.subject && c.chapter === ch.chapter)
                  ).map((chapterObj, idx) => {
                    const isSelected = (missionConfig.dailyTodos?.[todayStr] || []).some(
                      c => c.subject === chapterObj.subject && c.chapter === chapterObj.chapter
                    );
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleTodo(chapterObj.subject, chapterObj.chapter)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                          isSelected 
                            ? "bg-brand-50 border-brand-200" 
                            : "bg-white border-slate-200 hover:border-brand-200"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-brand-500 border-brand-500 text-white" : "border-slate-300 group-hover:border-brand-400"
                        )}>
                          {isSelected && <CheckCircle2 size={16} />}
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            "font-bold transition-all",
                            isSelected ? "text-brand-900" : "text-slate-900"
                          )}>
                            {chapterObj.chapter}
                          </p>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                            {chapterObj.subject}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {(missionConfig.dailyTodos?.[todayStr] || []).length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      <p className="text-slate-500 font-medium mb-4">You haven't added any chapters to today's list.</p>
                      <button
                        onClick={() => setIsEditingTodo(true)}
                        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
                      >
                        Plan Today's Mission
                      </button>
                    </div>
                  ) : (
                    (missionConfig.dailyTodos?.[todayStr] || []).map((chapterObj, idx) => {
                      const isDone = (missionConfig.completedChapters || []).some(
                        c => c.subject === chapterObj.subject && c.chapter === chapterObj.chapter
                      );
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleChapterDone(chapterObj.subject, chapterObj.chapter)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                            isDone 
                              ? "bg-slate-50 border-slate-200 opacity-70" 
                              : "bg-white border-slate-200 hover:border-brand-300 hover:shadow-md"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 group-hover:border-brand-500"
                          )}>
                            {isDone && <CheckCircle2 size={16} />}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "font-bold transition-all",
                              isDone ? "text-slate-500 line-through decoration-2 decoration-emerald-500" : "text-slate-900"
                            )}>
                              {chapterObj.chapter}
                            </p>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                              {chapterObj.subject}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'welcome' && renderWelcome()}
      {step === 'options' && renderOptions()}
      {step === 'setup' && renderSetup()}
      {step === 'setup_chapters' && renderSetupChapters()}
      {step === 'summary' && renderDashboard()}
    </AnimatePresence>
  );
};
