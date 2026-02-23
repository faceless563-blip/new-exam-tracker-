import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Hash, ArrowRight, CheckCircle2, AlertCircle, Loader2, LogIn, User, Sparkles, GraduationCap, BookOpen, BrainCircuit, Bot, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: (rollNumber: string, name: string, phone: string, remember: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'WELCOME' | 'NAME_PROMPT' | 'PHONE_PROMPT' | 'ROLL' | 'LOGIN' | 'TOUR'>('WELCOME');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [generatedRoll, setGeneratedRoll] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tourStep, setTourStep] = useState(0);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!phone || !/^(\+8801|01)[3-9]\d{8}$/.test(phone)) {
        throw new Error("Invalid Bangladeshi phone number");
      }
      if (!name || name.trim().length < 2) {
        throw new Error("Please enter a valid name");
      }

      const roll = "GST-" + Math.floor(100000 + Math.random() * 899999).toString();
      
      // Save to "Registry" (Mock Database in LocalStorage)
      const registry = JSON.parse(localStorage.getItem('user_registry') || '{}');
      registry[roll] = { name, phone };
      localStorage.setItem('user_registry', JSON.stringify(registry));
      
      setGeneratedRoll(roll);
      setUserName(name);
      setUserPhone(phone);
      setStep('ROLL');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const registry = JSON.parse(localStorage.getItem('user_registry') || '{}');
      const userData = registry[rollNumberInput];
      
      if (!userData) {
        throw new Error("Roll number not found within this department.");
      }
      
      onLogin(rollNumberInput, userData.name, userData.phone, rememberMe);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name) {
      setError("Please enter your name and phone number first");
      setStep('NAME_PROMPT');
      return;
    }
    handleRegister(e);
  };

  const tourContent = [
    {
      title: "Track Your Exams",
      desc: "Log every exam, track your grades, and see your accuracy improve over time. We handle the negative marking math for you!",
      icon: GraduationCap
    },
    {
      title: "Syllabus Mastery",
      desc: "Our Curriculum Tracker covers the entire NCTB syllabus. Mark chapters as 'Class Done', 'QB Solved', and 'GST Ready'.",
      icon: BookOpen
    },
    {
      title: "AI Study Buddy",
      desc: "Get personalized advice from Gemini AI. It analyzes your weak spots and creates custom study plans just for you.",
      icon: BrainCircuit
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden"
      >
        <div className="p-8 sm:p-12">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Hash className="text-brand-600" size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">GST Fighter</h1>
            <p className="text-slate-500 font-medium">Your personal admission companion</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'WELCOME' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="space-y-8 text-center"
              >
                <div className="space-y-6">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-24 h-24 bg-brand-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-200"
                  >
                    <Sparkles className="text-white" size={48} />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tighter">Hello! 👋</h2>
                    <p className="text-slate-500 font-bold text-lg">
                      I'm your AI Study Buddy. Let's get you ready for GST!
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setStep('NAME_PROMPT')}
                    className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
                  >
                    Get Started <ArrowRight size={24} />
                  </button>
                  <button 
                    onClick={() => setStep('LOGIN')}
                    className="w-full py-4 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Login with Roll Number
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'NAME_PROMPT' && (
              <motion.div
                key="name_prompt"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <User className="text-brand-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Should we call?</h2>
                  <p className="text-slate-500 font-medium italic">Tell me your name so I can address you properly!</p>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Enter your name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-black text-2xl text-slate-800 placeholder:text-slate-300 text-center"
                    />
                  </div>

                  <button 
                    disabled={name.length < 2}
                    onClick={() => setStep('PHONE_PROMPT')}
                    className="w-full py-5 bg-brand-600 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-700 transition-all shadow-xl shadow-brand-100 disabled:opacity-50 disabled:grayscale"
                  >
                    Next <ArrowRight size={24} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'PHONE_PROMPT' && (
              <motion.form 
                key="phone"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                onSubmit={handleRegister}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="text-brand-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">One last thing, {name.split(' ')[0]}!</h2>
                  <p className="text-slate-500 font-medium">Your phone number helps us keep your progress safe.</p>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    <input 
                      type="tel"
                      required
                      autoFocus
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-black text-2xl text-slate-800"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Finish Setup <ArrowRight size={24} /></>}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'ROLL' && (
              <motion.div 
                key="roll"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="p-10 bg-emerald-50 rounded-[3rem] border-2 border-emerald-100 relative overflow-hidden">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100/50 rounded-full blur-3xl"
                  />
                  <CheckCircle2 className="text-emerald-500 mx-auto mb-6" size={64} />
                  <h2 className="text-2xl font-black text-slate-900 mb-2">You're all set, {userName.split(' ')[0]}!</h2>
                  <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                    We've created a unique Roll Number for you. Use this to access your data from any device.
                  </p>
                  <div className="bg-white p-6 rounded-3xl border-4 border-emerald-200 text-4xl font-black text-emerald-600 tracking-wider shadow-inner">
                    {generatedRoll}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-6 font-black uppercase tracking-[0.2em]">SAVE THIS NUMBER SECURELY</p>
                </div>

                <button 
                  onClick={() => setStep('TOUR')}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200"
                >
                  Take a Quick Tour <Sparkles size={24} />
                </button>
              </motion.div>
            )}

            {step === 'TOUR' && (
              <motion.div
                key="tour"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="relative p-8 bg-brand-600 rounded-[3rem] text-white overflow-hidden shadow-2xl">
                  <motion.div 
                    animate={{ 
                      y: [0, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -right-4 -top-4 opacity-20"
                  >
                    <BrainCircuit size={120} />
                  </motion.div>
                  
                  <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30">
                      <Sparkles size={40} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">AI Study Buddy</h3>
                      <p className="text-brand-100 font-bold opacity-80 uppercase tracking-widest text-[10px]">Your Personal Guide</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 min-h-[200px] flex flex-col justify-center gap-4 relative">
                  <div className="absolute -top-3 left-10 bg-white px-4 py-1 rounded-full border-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Buddy Says:
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0 mt-1">
                      {React.createElement(tourContent[tourStep].icon, { className: "text-brand-600", size: 20 })}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-slate-900">{tourContent[tourStep].title}</h4>
                      <p className="text-slate-600 font-bold leading-relaxed">
                        {tourContent[tourStep].desc}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2">
                  <div className="flex gap-1">
                    {tourContent.map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === tourStep ? "w-8 bg-brand-600" : "w-2 bg-slate-200"
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {tourStep > 0 && (
                      <button 
                        onClick={() => setTourStep(s => s - 1)}
                        className="p-4 bg-white text-slate-400 border-2 border-slate-100 rounded-2xl hover:text-slate-600 transition-all"
                      >
                        <ArrowRight size={20} className="rotate-180" />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (tourStep < tourContent.length - 1) {
                          setTourStep(s => s + 1);
                        } else {
                          onLogin(generatedRoll, userName, userPhone, rememberMe);
                        }
                      }}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                      {tourStep < tourContent.length - 1 ? 'Next' : 'Let\'s Go!'} <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {step === 'LOGIN' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">In-App Roll Number</label>
                    <div className="relative">
                      <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="text"
                        required
                        placeholder="GST-XXXXXX"
                        value={rollNumberInput}
                        onChange={e => setRollNumberInput(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group p-2">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-slate-200 rounded-md peer-checked:bg-brand-600 peer-checked:border-brand-600 transition-all" />
                      <CheckCircle2 className="absolute inset-0 text-white scale-0 peer-checked:scale-75 transition-transform" size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Remember Me</span>
                  </label>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={20} /></>}
                </button>

                <div className="text-center space-y-4">
                  <button 
                    type="button"
                    onClick={() => setStep('NAME_PROMPT')}
                    className="text-sm font-bold text-brand-600 hover:text-brand-700 block w-full"
                  >
                    Don't have an account? Register
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep('WELCOME')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    ← Back to Welcome
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
