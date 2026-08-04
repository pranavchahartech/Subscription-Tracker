import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Wallet, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Register = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return setError('Please fill in all fields');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    setLoading(true);
    const result = await register(email, password);
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full pointer-events-none animate-spin-slow"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)', filter: 'blur(45px)' }} />
      <div className="absolute bottom-1/4 left-1/5 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)', filter: 'blur(50px)' }} />

      <div className="w-full max-w-md glass-card p-8 shadow-2xl relative z-10 animate-fade-scale"
        style={{ boxShadow: '0 0 60px rgba(6,182,212,0.1), 0 24px 48px rgba(0,0,0,0.4)' }}>

        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 rounded-2xl mb-4 animate-float"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', boxShadow: '0 8px 24px rgba(6,182,212,0.35)' }}>
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold" style={{
            background: 'linear-gradient(135deg,#06b6d4,#7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Create Account</h2>
          <p className="text-sm mt-1" style={{ color:'#64748b' }}>Start tracking your subscriptions today</p>
        </div>

        {error && (
          <div className="text-sm rounded-xl p-3 mb-5 flex items-center gap-2 animate-slide-up"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', color:'#fda4af' }}>
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 stagger-children">
          <div className="animate-slide-up">
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color:'#64748b' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4" style={{ color:'#475569' }} />
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field w-full py-3 pl-11 pr-4 text-sm" style={{ color:'#e2eaf5' }} required />
            </div>
          </div>

          <div className="animate-slide-up">
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color:'#64748b' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4" style={{ color:'#475569' }} />
              <input type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field w-full py-3 pl-11 pr-11 text-sm" style={{ color:'#e2eaf5' }} required />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-3.5" style={{ color:'#475569' }}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="animate-slide-up">
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color:'#64748b' }}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4" style={{ color:'#475569' }} />
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="input-field w-full py-3 pl-11 pr-4 text-sm" style={{ color:'#e2eaf5' }} required />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="animate-slide-up w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', boxShadow: '0 8px 24px rgba(6,182,212,0.25)' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>Create Account <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        <div className="mt-7 text-center pt-6" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
          <p className="text-sm" style={{ color:'#475569' }}>
            Already have an account?{' '}
            <button onClick={onNavigateToLogin} className="font-semibold transition-colors"
              style={{ color:'#7c3aed' }}
              onMouseEnter={e => e.currentTarget.style.color='#06b6d4'}
              onMouseLeave={e => e.currentTarget.style.color='#7c3aed'}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
