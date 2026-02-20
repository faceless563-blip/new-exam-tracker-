import React, { useState } from 'react';
import { Sparkles, Loader2, BookOpen, Calendar, BrainCircuit, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Exam } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface AIStudyBuddyProps {
  exams: Exam[];
}

export const AIStudyBuddy: React.FC<AIStudyBuddyProps> = ({ exams }) => {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tips' | 'plan'>('tips');

  const generateAdvice = async (type: 'tips' | 'plan') => {
    if (exams.length === 0) return;
    
    setLoading(true);
    setActiveTab(type);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const examData = exams.map(e => ({
        subject: e.subject,
        date: e.date,
        topics: e.topics.map(t => t.name),
        progress: e.topics.filter(t => t.isCompleted).length / e.topics.length
      }));

      const prompt = type === 'tips' 
        ? `Based on these upcoming exams: ${JSON.stringify(examData)}, give me 5 highly specific, actionable study tips to maximize my efficiency. Focus on the exams that are closest or have the least progress.`
        : `Create a detailed weekly study plan for these exams: ${JSON.stringify(examData)}. Break it down by day and suggest which topics to focus on based on their proximity and current progress.`;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });

      setAdvice(response.text || "Sorry, I couldn't generate advice right now.");
    } catch (error) {
      console.error("AI Error:", error);
      setAdvice("Error connecting to AI. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 bg-gradient-to-br from-brand-600 to-indigo-700 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Sparkles size={24} className="text-brand-100" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">AI Study Buddy</h3>
            <p className="text-brand-100 text-sm">Powered by Gemini AI</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => generateAdvice('tips')}
            disabled={loading || exams.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'tips' && advice 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            } disabled:opacity-50`}
          >
            <BrainCircuit size={18} />
            Smart Tips
          </button>
          <button
            onClick={() => generateAdvice('plan')}
            disabled={loading || exams.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'plan' && advice 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            } disabled:opacity-50`}
          >
            <Calendar size={18} />
            Study Plan
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-slate-400 gap-4"
            >
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm font-medium animate-pulse">Analyzing your schedule...</p>
            </motion.div>
          ) : advice ? (
            <motion.div
              key="advice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-slate prose-sm max-w-none"
            >
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 markdown-body">
                <Markdown>{advice}</Markdown>
              </div>
              <button 
                onClick={() => setAdvice(null)}
                className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                Clear advice <ChevronRight size={12} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-500 font-medium">
                {exams.length === 0 
                  ? "Add some exams to get AI study advice!" 
                  : "Click a button above to generate AI insights."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
