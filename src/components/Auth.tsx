import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Hash, ArrowRight, CheckCircle2, AlertCircle, Loader2, LogIn, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: (rollNumber: string, name: string, phone: string, remember: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'ROLL' | 'LOGIN'>('PHONE');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [generatedRoll, setGeneratedRoll] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.otp) {
        setSimulatedOtp(data.otp);
      }
      setStep('OTP');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setGeneratedRoll(data.rollNumber);
      setUserName(name);
      setUserPhone(phone);
      setStep('ROLL');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: rollNumberInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onLogin(data.rollNumber, data.name, data.phone, rememberMe);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRoll = async () => {
    if (!phone) {
      setError("Please enter your phone number first");
      setStep('PHONE');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.otp) setSimulatedOtp(data.otp);
      setStep('OTP');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
            {step === 'PHONE' && (
              <motion.form 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRequestOtp}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="text"
                        required
                        placeholder="Your Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-slate-700"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">Enter your Bangladeshi mobile number to register</p>
                  </div>
                </div>

                {simulatedOtp && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold text-center">
                    Verification Code: <span className="text-lg font-black ml-2">{simulatedOtp}</span>
                  </div>
                )}

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
                  {loading ? <Loader2 className="animate-spin" /> : <>Send Code <ArrowRight size={20} /></>}
                </button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setStep('LOGIN')}
                    className="text-sm font-bold text-brand-600 hover:text-brand-700"
                  >
                    Already have a Roll Number? Login
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'OTP' && (
              <motion.form 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Verification Code</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text"
                      required
                      placeholder="6-digit code"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-slate-700 tracking-[0.5em]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-1">Check your console for the simulated code</p>
                </div>

                {simulatedOtp && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-bold text-center">
                    Simulated Code: <span className="text-lg font-black ml-2">{simulatedOtp}</span>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Verify & Register <ArrowRight size={20} /></>}
                </button>

                <button 
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="w-full text-sm font-bold text-slate-400 hover:text-slate-600"
                >
                  Change Phone Number
                </button>
              </motion.form>
            )}

            {step === 'ROLL' && (
              <motion.div 
                key="roll"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                  <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
                  <h2 className="text-xl font-black text-slate-900 mb-2">Registration Successful!</h2>
                  <p className="text-sm text-slate-500 mb-6">Your unique In-App Roll Number is:</p>
                  <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200 text-3xl font-black text-emerald-600 tracking-wider">
                    {generatedRoll}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase">SAVE THIS NUMBER TO LOGIN LATER</p>
                </div>

                <button 
                  onClick={() => onLogin(generatedRoll, userName, userPhone, rememberMe)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Enter Dashboard <ArrowRight size={20} />
                </button>
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
                    onClick={() => setStep('PHONE')}
                    className="text-sm font-bold text-brand-600 hover:text-brand-700 block w-full"
                  >
                    Don't have an account? Register
                  </button>
                  <button 
                    type="button"
                    onClick={handleForgotRoll}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Forgot Roll Number? Verify via Phone
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
