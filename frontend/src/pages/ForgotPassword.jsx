import React, { useState } from 'react';
import client from '../api/client';
import { Mail, Lock, Loader2, KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = ({ onNavigateToLogin }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address');
    setError(''); setLoading(true);
    try {
      await client.post('/api/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code');
    } finally { setLoading(false); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code) return setError('Please enter the 6-digit code');
    setError(''); setLoading(true);
    try {
      const res = await client.post('/api/auth/verify-reset-code', { email, code });
      setResetToken(res.data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return setError('Please fill in all fields');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    setError(''); setLoading(true);
    try {
      await client.post('/api/auth/reset-password', { email, resetToken, newPassword });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const stepTitles = ['', 'Reset Password', 'Verify Code', 'New Password', 'All Done!'];
  const stepSubs = ['',
    'Enter your email to receive a 6-digit recovery code',
    `We sent a 6-digit code to ${email}`,
    'Choose a strong new password',
    'Your password has been updated successfully'
  ];

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none animate-spin-slow"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(45px)' }} />

      <div className="w-full max-w-md glass-card p-8 shadow-2xl relative z-10 animate-fade-scale"
        style={{ boxShadow: '0 0 60px rgba(124,58,237,0.1), 0 24px 48px rgba(0,0,0,0.4)' }}>

        {/* Step indicator */}
        {step < 4 && (
          <div className="flex items-center gap-1.5 mb-6">
            {[1,2,3].map(s => (
              <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{ background: s <= step ? 'linear-gradient(90deg,#7c3aed,#06b6d4)' : 'rgba(30,58,95,0.5)' }} />
            ))}
          </div>
        )}

        <div className="flex flex-col items-center mb-7">
          <div className={`p-3.5 rounded-2xl mb-4 ${step === 4 ? '' : 'animate-float'}`}
            style={{ background: step === 4 ? 'linear-gradient(135deg,#10b981,#06b6d4)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
              boxShadow: `0 8px 24px ${step === 4 ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}` }}>
            {step === 4 ? <CheckCircle2 className="h-7 w-7 text-white" /> : <KeyRound className="h-7 w-7 text-white" />}
          </div>
          <h2 className="text-2xl font-bold gradient-text">{stepTitles[step]}</h2>
          <p className="text-sm mt-1 text-center" style={{ color:'#64748b' }}>{stepSubs[step]}</p>
        </div>

        {error && (
          <div className="text-sm rounded-xl p-3 mb-5 animate-slide-up"
            style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)', color:'#fda4af' }}>
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color:'#64748b' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4 w-4" style={{ color:'#475569' }} />
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field w-full py-3 pl-11 pr-4 text-sm" style={{ color:'#e2eaf5' }} required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color:'#64748b' }}>6-Digit Code</label>
              <input type="text" maxLength="6" placeholder="123456" value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g,''))}
                className="input-field w-full py-4 text-center text-2xl font-bold tracking-[0.5em]"
                style={{ color:'#e2eaf5', letterSpacing: '0.5em' }} required />
              <p className="text-xs mt-2 text-center" style={{ color:'#475569' }}>Check your inbox — code is valid for 10 minutes</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{ background:'rgba(30,58,95,0.4)', color:'#94a3b8', border:'1px solid rgba(30,58,95,0.6)' }}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Code'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color:'#64748b' }}>New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4" style={{ color:'#475569' }} />
                <input type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field w-full py-3 pl-11 pr-11 text-sm" style={{ color:'#e2eaf5' }} required />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-3.5" style={{ color:'#475569' }}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color:'#64748b' }}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4" style={{ color:'#475569' }} />
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field w-full py-3 pl-11 pr-4 text-sm" style={{ color:'#e2eaf5' }} required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center gap-5 animate-badge-pop">
            <div className="p-5 rounded-full" style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle2 className="h-12 w-12" style={{ color:'#10b981' }} />
            </div>
            <p className="text-sm text-center" style={{ color:'#94a3b8' }}>
              Your password was reset. You can now log in with your new credentials.
            </p>
            <button onClick={onNavigateToLogin} className="btn-primary w-full text-center">
              Back to Login
            </button>
          </div>
        )}

        {step < 4 && (
          <div className="mt-6 text-center pt-5" style={{ borderTop:'1px solid rgba(30,58,95,0.5)' }}>
            <button onClick={onNavigateToLogin} className="text-sm font-medium transition-colors"
              style={{ color:'#475569' }}
              onMouseEnter={e => e.currentTarget.style.color='#e2eaf5'}
              onMouseLeave={e => e.currentTarget.style.color='#475569'}>
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
