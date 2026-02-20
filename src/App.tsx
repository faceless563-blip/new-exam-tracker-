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
  TrendingUp, 
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Exam, ExamStatus } from './types';
import { ExamCard } from './components/ExamCard';
import { ExamForm } from './components/ExamForm';
import { AIStudyBuddy } from './components/AIStudyBuddy';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';

export default function App() {
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('exams');
    return saved ? JSON.parse(saved) : [];
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<ExamStatus | 'ALL'>('ALL');

  useEffect(() => {
    localStorage.setItem('exams', JSON.stringify(exams));
  }, [exams]);

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

  const handleDeleteExam = (id: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      setExams(exams.filter(e => e.id !== id));
    }
  };

  const handleToggleTopic = (examId: string, topicId: string) => {
    setExams(exams.map(e => {
      if (e.id === examId) {
        return {
          ...e,
          topics: e.topics.map(t => t.id === topicId ? { ...t, isCompleted: !t.isCompleted } : t)
        };
      }
      return e;
    }));
  };

  const filteredExams = useMemo(() => {
    return exams
      .filter(e => {
        const matchesSearch = e.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'ALL' || e.status === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const upcoming = exams.filter(e => e.status === ExamStatus.UPCOMING).length;
    const completed = exams.filter(e => e.status === ExamStatus.COMPLETED).length;
    const totalTopics = exams.reduce((acc, e) => acc + e.topics.length, 0);
    const completedTopics = exams.reduce((acc, e) => acc + e.topics.filter(t => t.isCompleted).length, 0);
    const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    return { upcoming, completed, overallProgress };
  }, [exams]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">ExamFlow</h1>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl px-3 py-2 gap-2 border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:bg-white transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search exams..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-700 w-64"
              />
            </div>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Exam</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-brand-600" size={20} />
                  <h3 className="font-bold text-slate-900">Overall Progress</h3>
                </div>
                <span className="text-sm font-bold text-brand-600">{Math.round(stats.overallProgress)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.overallProgress}%` }}
                  className="h-full bg-brand-500 rounded-full"
                />
              </div>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                Keep it up! You've completed {exams.reduce((acc, e) => acc + e.topics.filter(t => t.isCompleted).length, 0)} out of {exams.reduce((acc, e) => acc + e.topics.length, 0)} total topics across all subjects.
              </p>
            </div>

            <AIStudyBuddy exams={exams} />
          </div>

          {/* Right Column: Exam List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 w-fit">
                <button 
                  onClick={() => setFilterStatus('ALL')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                    filterStatus === 'ALL' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  All
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
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredExams.length > 0 ? (
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
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isFormOpen && (
          <ExamForm
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
