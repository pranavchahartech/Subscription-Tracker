import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Wallet, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = ({ onNavigateToRegister, onNavigateToForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please fill in all fields');
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center relative overflow-hidden px-4">
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full pointer-events-none animate-spin-slow"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)', filter: 'blur(50px)', animationDelay: '2s' }} />

      <div className="w-full max-w-md glass-card p-8 shadow-2xl relative z-10 animate-fade-scale"
        style={{ boxShadow: '0 0 60px rgba(124,58,237,0.12), 0 24px 48px rgba(0,0,0,0.4)' }}>

        {/* Logo header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 rounded-2xl mb-4 animate-float"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold gradient-text">Welcome back</h2>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Sign in to your SubSpace account</p>
        </div>

        {error && (
          <div className="text-sm rounded-xl p-3 mb-5 flex items-center gap-2 animate-slide-up"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af' }}>
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 stagger-children">
          {/* Email */}
          <div className="animate-slide-up">
            <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color:'#64748b' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4" style={{ color:'#475569' }} />
              <input
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="input-field w-full py-3 pl-11 pr-4 text-sm"
                style={{ color: '#e2eaf5' }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="animate-slide-up">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color:'#64748b' }}>
                Password
              </label>
              <button type="button" onClick={onNavigateToForgotPassword}
                className="text-xs font-semibold transition-colors"
                style={{ color:'#7c3aed' }}
                onMouseEnter={e => e.currentTarget.style.color='#06b6d4'}
                onMouseLeave={e => e.currentTarget.style.color='#7c3aed'}>
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4" style={{ color:'#475569' }} />
              <input
                type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                className="input-field w-full py-3 pl-11 pr-11 text-sm"
                style={{ color: '#e2eaf5' }}
                required
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-4 top-3.5 transition-colors"
                style={{ color:'#475569' }}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="btn-primary animate-slide-up w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>Sign In <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>

        <div className="mt-7 text-center pt-6" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
          <p className="text-sm" style={{ color:'#475569' }}>
            Don't have an account?{' '}
            <button onClick={onNavigateToRegister} className="font-semibold transition-colors"
              style={{ color:'#06b6d4' }}
              onMouseEnter={e => e.currentTarget.style.color='#7c3aed'}
              onMouseLeave={e => e.currentTarget.style.color='#06b6d4'}>
              Sign up free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
