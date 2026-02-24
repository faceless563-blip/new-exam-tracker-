import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, TrendingUp, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { SUBJECTS } from '../constants';
import { DailyStudyRecord } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface StudyTimerProps {
  dailyStudyTime: Record<string, DailyStudyRecord>;
  onUpdateStudyTime: (date: string, record: DailyStudyRecord) => void;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ dailyStudyTime, onUpdateStudyTime }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0]);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [historyTab, setHistoryTab] = useState<'calendar' | 'trends'>('calendar');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Load today's elapsed time on mount or when dailyStudyTime changes
  useEffect(() => {
    const todayRecord = dailyStudyTime[todayStr] || { total: 0, subjects: {}, chapters: {} };
    setElapsedSeconds(todayRecord.total || 0);
  }, [dailyStudyTime, todayStr]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          // Save every 10 seconds to avoid too many writes
          if (next % 10 === 0) {
            saveProgress(next);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, todayStr, selectedSubject, dailyStudyTime]);

  const saveProgress = (currentElapsed: number) => {
    const todayRecord = dailyStudyTime[todayStr] || { total: 0, subjects: {}, chapters: {} };
    
    // Calculate the difference to add
    const diff = currentElapsed - (todayRecord.total || 0);
    if (diff <= 0) return;

    const currentSubjects = todayRecord.subjects || {};

    const newRecord: DailyStudyRecord = {
      total: currentElapsed,
      subjects: {
        ...currentSubjects,
        [selectedSubject]: (currentSubjects[selectedSubject] || 0) + diff
      },
      chapters: todayRecord.chapters || {}
    };
    
    onUpdateStudyTime(todayStr, newRecord);
  };

  const handleToggle = () => {
    if (isRunning) {
      // Pausing, save immediately
      saveProgress(elapsedSeconds);
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
    setIsRunning(!isRunning);
  };

  const handleStopClick = () => {
    if (isRunning) {
      setIsRunning(false);
      saveProgress(elapsedSeconds);
    }
    setShowStopConfirm(true);
  };

  const confirmStop = () => {
    setShowStopConfirm(false);
    setSelectedSubject(SUBJECTS[0]);
    setIsPaused(false);
  };

  const cancelStop = () => {
    setShowStopConfirm(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setSelectedSubject(SUBJECTS[0]);
    onUpdateStudyTime(todayStr, { total: 0, subjects: {}, chapters: {} });
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHoursMinutes = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const chartData = daysInMonth.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = dailyStudyTime[dateStr];
    const hours = (record?.total || 0) / 3600;
    return {
      date: format(date, 'MMM d'),
      hours: Number(hours.toFixed(2))
    };
  });

  const monthlyTotalSeconds = daysInMonth.reduce((acc, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return acc + (dailyStudyTime[dateStr]?.total || 0);
  }, 0);

  const overallTotalSeconds = Object.values(dailyStudyTime).reduce((acc, record) => {
    return acc + (record?.total || 0);
  }, 0);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedRecord = dailyStudyTime[selectedDateStr];
  const selectedDateTime = selectedRecord?.total || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Timer */}
      <div className="lg:col-span-5 space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="text-brand-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Study Timer</h2>
          <p className="text-slate-500 font-medium mb-8">Track your daily study sessions</p>

          {!isRunning && !isPaused && (
            <div className="space-y-4 mb-8 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none appearance-none font-medium text-slate-700"
                  >
                    {SUBJECTS.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {(isRunning || isPaused) && (
            <div className="mb-8 p-4 bg-brand-50 rounded-2xl border border-brand-100 text-left">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  {isPaused ? "Paused" : "Currently Studying"}
                </p>
                <div className="text-xs font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md">
                  {formatHoursMinutes(dailyStudyTime[todayStr]?.subjects?.[selectedSubject] || 0)} today
                </div>
              </div>
              <p className="font-bold text-slate-900 truncate text-lg">{selectedSubject}</p>
            </div>
          )}

          <div className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tighter mb-2 font-mono">
            {formatTime(elapsedSeconds)}
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Total Today</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleToggle}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl",
                isRunning 
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30" 
                  : "bg-brand-600 hover:bg-brand-700 shadow-brand-600/30"
              )}
            >
              {isRunning ? <Pause className="text-white" size={32} /> : <Play className="text-white ml-2" size={32} />}
            </button>
            {(isRunning || isPaused) && (
              <button
                onClick={handleStopClick}
                className="w-16 h-16 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all text-slate-600"
              >
                <Square size={24} />
              </button>
            )}
            {elapsedSeconds > 0 && !isRunning && (
              <button
                onClick={handleReset}
                className="w-16 h-16 rounded-full bg-rose-100 hover:bg-rose-200 flex items-center justify-center transition-all text-rose-600"
                title="Reset Today's Timer"
              >
                <RotateCcw size={24} />
              </button>
            )}
          </div>
          
          {isRunning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex items-center justify-center gap-2 text-brand-600 font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
              Focus mode active
            </motion.div>
          )}

          {isPaused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex items-center justify-center gap-2 text-amber-600 font-bold"
            >
              Session paused. Click play to resume.
            </motion.div>
          )}
        </div>
      </div>

      {showStopConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl"
          >
            <h3 className="text-xl font-black text-slate-900 mb-2">End Study Session?</h3>
            <p className="text-slate-500 mb-8 font-medium">Are you sure you want to end this study session? Your progress has been saved.</p>
            <div className="flex gap-3">
              <button 
                onClick={cancelStop}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmStop}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
              >
                End Session
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Right Column: Calendar & Trends */}
      <div className="lg:col-span-7 space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setHistoryTab('calendar')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                    historyTab === 'calendar' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <CalendarIcon size={16} />
                  Calendar
                </button>
                <button
                  onClick={() => setHistoryTab('trends')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                    historyTab === 'trends' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <TrendingUp size={16} />
                  Trends
                </button>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <Clock size={16} className="text-brand-500" />
                <span>{formatHoursMinutes(monthlyTotalSeconds)} this month</span>
                <span className="text-slate-300">|</span>
                <span>{formatHoursMinutes(overallTotalSeconds)} overall</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <span className="font-bold text-slate-700 w-32 text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
          </div>

          {historyTab === 'calendar' ? (
            <>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for start of month */}
                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {daysInMonth.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const record = dailyStudyTime[dateStr];
                  const seconds = record?.total || 0;
                  const hasStudied = seconds > 0;
                  const isSelected = isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);
                  
                  // Calculate intensity for color (max 8 hours = 28800 seconds)
                  const intensity = Math.min(seconds / 28800, 1);
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all",
                        isSelected ? "ring-2 ring-brand-500 ring-offset-2" : "hover:bg-slate-50",
                        hasStudied ? "bg-brand-50" : "bg-white border border-slate-100",
                        isTodayDate && !isSelected && "border-brand-300 border-2"
                      )}
                      style={hasStudied ? {
                        backgroundColor: `rgba(13, 148, 136, ${0.1 + intensity * 0.9})`,
                        color: intensity > 0.5 ? 'white' : 'inherit'
                      } : {}}
                    >
                      <span className={cn(
                        "text-sm font-bold",
                        hasStudied && intensity > 0.5 ? "text-white" : "text-slate-700"
                      )}>
                        {format(date, 'd')}
                      </span>
                      {hasStudied && (
                        <span className={cn(
                          "text-[10px] font-medium mt-0.5",
                          intensity > 0.5 ? "text-white/80" : "text-brand-600"
                        )}>
                          {formatHoursMinutes(seconds)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Selected Date Details */}
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">
                      {isToday(selectedDate) ? "Today" : format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {selectedDateTime > 0 ? formatHoursMinutes(selectedDateTime) : "No study time recorded"}
                    </p>
                  </div>
                  {selectedDateTime > 0 && (
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="text-emerald-600" size={24} />
                    </div>
                  )}
                </div>

                {selectedDateTime > 0 && selectedRecord?.subjects && (
                  <div className="space-y-3 border-t border-slate-200 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Subject Breakdown</h4>
                    {Object.entries(selectedRecord.subjects)
                      .sort(([, a], [, b]) => b - a)
                      .map(([subject, time]) => (
                        <div key={subject} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-brand-500" />
                            <span className="text-sm font-bold text-slate-700">{subject}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                            {formatHoursMinutes(time)}
                          </span>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-[400px] w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value} hours`, 'Study Time']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#0ea5e9" 
                    strokeWidth={4}
                    dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
