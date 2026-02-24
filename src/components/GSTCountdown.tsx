import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Target, Zap, AlertCircle, CheckCircle2, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { differenceInDays, format, parseISO, isAfter, differenceInMilliseconds } from 'date-fns';
import { ChapterProgress, Exam, ExamStatus } from '../types';
import { NCTB_CURRICULUM } from '../constants';
import { cn } from '../lib/utils';

interface GSTCountdownProps {
  progress: ChapterProgress[];
  exams: Exam[];
}

export const GSTCountdown: React.FC<GSTCountdownProps> = ({ progress, exams }) => {
  const targetDate = useMemo(() => new Date('2026-04-10T10:00:00'), []);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const daysLeft = differenceInDays(targetDate, now);
  
  const timeRemaining = useMemo(() => {
    const diff = differenceInMilliseconds(targetDate, now);
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }, [targetDate, now]);

  const currentDateFormatted = format(now, 'MMMM d, yyyy');
  const targetDateFormatted = format(targetDate, 'MMMM d, yyyy');
  
  const totalChapters = useMemo(() => {
    return Object.values(NCTB_CURRICULUM).reduce((acc, curr) => acc + curr.length, 0);
  }, []);

  const stats = useMemo(() => {
    let completionTasks = 0;
    let masteryTasks = 0;
    let fullyCompleted = 0;
    let fullyMastered = 0;

    progress.forEach(p => {
      // Check if any exam exists for this chapter
      const chapterExams = exams.filter(e => 
        e.topics.some(t => t.name === p.chapterName) && e.status === ExamStatus.COMPLETED
      );
      const hasTakenExam = chapterExams.length > 0;
      const hasHighScoredExam = chapterExams.some(e => 
        e.obtainedMarks !== undefined && e.totalMarks && (e.obtainedMarks / e.totalMarks) >= 0.8
      );

      if (p.isClassDone) completionTasks++;
      if (p.isUniQBDone) completionTasks++;
      if (p.isGSTQBDone) completionTasks++;
      if (hasTakenExam) completionTasks++; // 4 tasks for completion now? Or just a gate?
      
      if (p.firstRevisionAt) masteryTasks++;
      if (p.secondRevisionAt) masteryTasks++;
      if (hasHighScoredExam) masteryTasks++;

      const isCompleted = p.isClassDone && p.isUniQBDone && p.isGSTQBDone && hasTakenExam;
      const isMastered = p.firstRevisionAt && p.secondRevisionAt && hasHighScoredExam;

      if (isCompleted) fullyCompleted++;
      if (isMastered) fullyMastered++;
    });

    // We'll keep the percentage calculation based on the new task counts
    // Completion: 4 tasks (Class, Uni, GST, 1 Exam)
    // Mastery: 3 tasks (Rev1, Rev2, 80% Exam)
    const completionPct = (completionTasks / (totalChapters * 4)) * 100;
    const masteryPct = (masteryTasks / (totalChapters * 3)) * 100;
    const combinedPct = ((completionTasks + masteryTasks) / (totalChapters * 7)) * 100;

    return {
      completionPct,
      masteryPct,
      combinedPct,
      fullyCompleted,
      fullyMastered
    };
  }, [progress, exams, totalChapters]);

  const { completionPct, masteryPct, combinedPct, fullyCompleted, fullyMastered } = stats;
  
  // Logic for "On Track"
  const isOnTrack = completionPct >= 20; // Adjusted threshold since we count tasks now

  const milestones = [
    { date: '2026-02-22', label: 'Current Status', icon: Clock, color: 'text-brand-500' },
    { date: '2026-03-01', label: 'Physics Mastery', icon: Zap, color: 'text-amber-500' },
    { date: '2026-03-15', label: 'Chemistry Final', icon: CheckCircle2, color: 'text-emerald-500' },
    { date: '2026-04-01', label: 'Final Revision', icon: RefreshCw, color: 'text-blue-500' },
    { date: '2026-04-10', label: 'GST EXAM', icon: Target, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-200"
      >
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                <Target className="text-brand-400" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">GST EXAM 2026</h3>
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Target: {targetDateFormatted}</p>
                  <p className="text-[10px] font-bold text-brand-400/60 uppercase tracking-widest">Today: {currentDateFormatted}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5",
                isOnTrack ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/20 text-rose-400 border border-rose-500/20"
              )}>
                {isOnTrack ? <Zap size={10} /> : <AlertCircle size={10} />}
                {isOnTrack ? 'On Track' : 'Behind Schedule'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Time Remaining</p>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-4xl md:text-5xl font-black tracking-tighter text-brand-400 w-16 text-center">
                    {timeRemaining.days.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Days</span>
                </div>
                <span className="text-2xl font-black text-white/20 -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl md:text-5xl font-black tracking-tighter text-white w-16 text-center">
                    {timeRemaining.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Hours</span>
                </div>
                <span className="text-2xl font-black text-white/20 -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl md:text-5xl font-black tracking-tighter text-white w-16 text-center">
                    {timeRemaining.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Mins</span>
                </div>
                <span className="text-2xl font-black text-white/20 -mt-4">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl md:text-5xl font-black tracking-tighter text-brand-400 w-16 text-center">
                    {timeRemaining.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Secs</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white/40">Completion</span>
                  <span className="text-emerald-400">{completionPct.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white/40">Mastery</span>
                  <span className="text-brand-400">{masteryPct.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bars Section */}
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Completion Progress</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(completionPct, 1)}%` }}
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Mastery Progress</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(masteryPct, 1)}%` }}
                    className="h-full bg-brand-500 shadow-[0_0_10px_rgba(var(--brand-600-rgb),0.3)]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Combined Readiness</span>
                <span className="text-[10px] font-black text-white/60">{combinedPct.toFixed(2)}%</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(combinedPct, 1)}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-brand-500 to-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Guide Section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="text-emerald-400" size={16} />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">How to Complete</span>
              </div>
              <p className="text-[10px] text-white/40 leading-tight">Class, Uni QB, GST QB, and at least one exam taken.</p>
              <p className="text-xl font-black mt-2">{fullyCompleted} <span className="text-xs font-medium text-white/20">/ {totalChapters} Chapters</span></p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-brand-400" size={16} />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">How to Master</span>
              </div>
              <p className="text-[10px] text-white/40 leading-tight">1st & 2nd Revisions + Score {'>'} 80% in an exam.</p>
              <p className="text-xl font-black mt-2">{fullyMastered} <span className="text-xs font-medium text-white/20">/ {totalChapters} Chapters</span></p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Course Calendar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-brand-600" />
          <h4 className="font-bold text-slate-900">Course Calendar</h4>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {milestones.map((m, i) => {
            const mDate = new Date(m.date);
            const isPast = isAfter(now, mDate);
            const isToday = format(now, 'yyyy-MM-dd') === m.date;
            
            return (
              <div key={i} className={cn(
                "flex-shrink-0 w-32 p-3 rounded-2xl border transition-all",
                isToday ? "bg-brand-50 border-brand-200 ring-2 ring-brand-500/10" : "bg-slate-50 border-slate-100",
                isPast && !isToday ? "opacity-50" : "opacity-100"
              )}>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{format(mDate, 'MMM d')}</p>
                <m.icon size={16} className={cn("mb-2", m.color)} />
                <p className="text-xs font-bold text-slate-700 leading-tight">{m.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Daily Motivation/Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
            isOnTrack ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {isOnTrack ? <Zap size={24} /> : <Clock size={24} />}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">
              {isOnTrack ? "You're doing great, fighter!" : "Time to pick up the pace!"}
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              {isOnTrack 
                ? `You've covered ${fullyCompleted} chapters already. Keep this momentum for the next ${daysLeft} days and you'll crush the GST exam on April 10th!`
                : `You're a bit behind on your curriculum goals. Focus on completing at least 2 more chapters this week to get back on track for April 10th.`}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
