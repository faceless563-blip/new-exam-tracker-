import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { Exam, ExamStatus, Topic } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
  const [subject, setSubject] = useState(exam?.subject || '');
  const [date, setDate] = useState(exam?.date ? exam.date.slice(0, 16) : '');
  const [location, setLocation] = useState(exam?.location || '');
  const [status, setStatus] = useState<ExamStatus>(exam?.status || ExamStatus.UPCOMING);
  const [targetGrade, setTargetGrade] = useState(exam?.targetGrade || '');
  const [color, setColor] = useState(exam?.color || COLORS[0]);
  const [topics, setTopics] = useState<Topic[]>(exam?.topics || []);
  const [newTopic, setNewTopic] = useState('');

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    setTopics([...topics, { id: crypto.randomUUID(), name: newTopic.trim(), isCompleted: false }]);
    setNewTopic('');
  };

  const handleRemoveTopic = (id: string) => {
    setTopics(topics.filter(t => t.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: exam?.id,
      subject,
      date: new Date(date).toISOString(),
      location,
      status,
      targetGrade,
      color,
      topics,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {exam ? 'Edit Exam' : 'Add New Exam'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Subject Name</label>
              <input
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Advanced Mathematics"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Exam Date & Time</label>
              <input
                required
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Location</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Hall B, Room 302"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Grade</label>
              <input
                value={targetGrade}
                onChange={e => setTargetGrade(e.target.value)}
                placeholder="e.g. A+"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

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

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">Study Topics</label>
              <span className="text-xs text-slate-400">{topics.length} topics added</span>
            </div>
            
            <div className="flex gap-2">
              <input
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                placeholder="Add a topic to study..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {topics.map(topic => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group"
                  >
                    <span className="text-sm text-slate-700">{topic.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic.id)}
                      className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
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
              {exam ? 'Update Exam' : 'Create Exam'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
