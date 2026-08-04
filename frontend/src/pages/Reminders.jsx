import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Bell, Calendar, Clock, CheckCircle2, Loader2, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';

const getRenewalInfo = (nextRenewalDate) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const renewal = new Date(nextRenewalDate); renewal.setHours(0,0,0,0);
  const diffDays = Math.ceil((renewal - today) / 86400000);
  if (diffDays < 0)  return { days: diffDays, text: `Overdue by ${Math.abs(diffDays)}d`, urgency: 'critical' };
  if (diffDays === 0) return { days: 0, text: 'Renews Today', urgency: 'critical' };
  if (diffDays <= 3)  return { days: diffDays, text: `In ${diffDays} day${diffDays>1?'s':''}`, urgency: 'high' };
  if (diffDays <= 7)  return { days: diffDays, text: `In ${diffDays} days`, urgency: 'medium' };
  return { days: diffDays, text: `In ${diffDays} days`, urgency: 'low' };
};

const URGENCY = {
  critical: { card: 'rgba(244,63,94,0.07)',   border: 'rgba(244,63,94,0.3)',   badge: 'rgba(244,63,94,0.12)',   color: '#f43f5e', label: 'URGENT' },
  high:     { card: 'rgba(244,63,94,0.05)',   border: 'rgba(244,63,94,0.2)',   badge: 'rgba(244,63,94,0.1)',    color: '#f87171', label: 'HIGH' },
  medium:   { card: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.25)', badge: 'rgba(245,158,11,0.1)',   color: '#f59e0b', label: 'SOON' },
  low:      { card: 'rgba(124,58,237,0.05)',  border: 'rgba(124,58,237,0.2)',  badge: 'rgba(124,58,237,0.1)',   color: '#a78bfa', label: 'UPCOMING' },
};

const SkeletonCard = ({ delay = 0 }) => (
  <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center gap-4">
      <div className="skeleton w-10 h-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-40" />
        <div className="skeleton h-2.5 w-24" />
      </div>
      <div className="skeleton h-8 w-24 rounded-xl" />
    </div>
  </div>
);

const Reminders = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/api/subscriptions')
      .then(res => {
        const active = res.data
          .filter(s => s.is_active)
          .sort((a, b) => new Date(a.next_renewal) - new Date(b.next_renewal));
        setSubscriptions(active);
      })
      .catch(() => setError('Failed to fetch renewal timeline.'))
      .finally(() => setLoading(false));
  }, []);

  const urgent = subscriptions.filter(s => {
    const info = getRenewalInfo(s.next_renewal);
    return info.urgency === 'critical' || info.urgency === 'high';
  });

  return (
    <div className="p-8 mesh-bg min-h-screen page-enter" style={{ color: '#e2eaf5' }}>
      {/* Header */}
      <header className="mb-7">
        <h1 className="text-3xl font-extrabold gradient-text">Renewal Reminders</h1>
        <p className="text-sm mt-1" style={{ color: '#475569' }}>Countdown timeline for all active recurring bills</p>
      </header>

      {/* Notice banner */}
      <div className="glass-card p-4 mb-7 flex items-start gap-3 animate-slide-up"
        style={{ borderColor: 'rgba(124,58,237,0.3)' }}>
        <div className="p-2 rounded-lg flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(124,58,237,0.15)' }}>
          <Bell className="h-4 w-4" style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <h4 className="text-sm font-bold" style={{ color: '#e2eaf5' }}>
            Daily Email Reminders Active
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full animate-badge-pop"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
              LIVE
            </span>
          </h4>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#475569' }}>
            Our cron job runs every day at 08:00 — subscriptions renewing within 7 days trigger an automatic email to your account.
          </p>
        </div>
      </div>

      {/* Urgent section */}
      {!loading && urgent.length > 0 && (
        <div className="mb-7 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4" style={{ color: '#f43f5e' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#f43f5e' }}>
              Requires Immediate Attention ({urgent.length})
            </h2>
          </div>
          <div className="space-y-3">
            {urgent.map((sub, i) => {
              const info = getRenewalInfo(sub.next_renewal);
              const u = URGENCY[info.urgency];
              return (
                <div key={sub.id} className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 animate-slide-up"
                  style={{ background: u.card, border: `1px solid ${u.border}`, animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{ background: 'rgba(13,21,38,0.8)', border: `1px solid ${u.border}`, color: u.color }}>
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#e2eaf5' }}>{sub.name}</p>
                      <div className="flex items-center gap-2 text-[10px] mt-0.5 font-mono" style={{ color: '#475569' }}>
                        <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(30,58,95,0.5)', color: '#94a3b8' }}>{sub.category}</span>
                        <span>•</span>
                        <span style={{ color: u.color }}>{new Date(sub.next_renewal).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Amount</p>
                      <p className="font-extrabold text-sm mt-0.5" style={{ color: '#e2eaf5' }}>
                        {sub.currency === 'INR' ? '₹' : sub.currency}{parseFloat(sub.cost).toFixed(2)}
                        <span className="text-[10px] font-medium ml-1" style={{ color: '#475569' }}>/{sub.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 animate-badge-pop"
                      style={{ background: u.badge, border: `1px solid ${u.border}`, color: u.color }}>
                      <AlertTriangle className="h-3 w-3" />
                      {info.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All subscriptions */}
      {error && (
        <div className="text-sm rounded-xl p-4 mb-5 flex items-center gap-2"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', color: '#fda4af' }}>
          <ShieldAlert className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4" style={{ color: '#64748b' }} />
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
          Full Timeline
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3 max-w-4xl">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} delay={i * 60} />)}
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="space-y-3 max-w-4xl stagger-children">
          {subscriptions.map((sub, idx) => {
            const info = getRenewalInfo(sub.next_renewal);
            const u = URGENCY[info.urgency];
            return (
              <div key={sub.id}
                className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:-translate-y-0.5 animate-slide-up"
                style={{ animationDelay: `${idx * 40}ms`, borderColor: info.urgency !== 'low' ? u.border : undefined }}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.15))', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#e2eaf5' }}>{sub.name}</p>
                    <div className="flex items-center gap-2 text-[10px] mt-1 font-mono" style={{ color: '#475569' }}>
                      <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(30,58,95,0.5)', color: '#94a3b8' }}>{sub.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(sub.next_renewal).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0"
                  style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Cost</p>
                    <p className="font-extrabold text-sm mt-0.5" style={{ color: '#e2eaf5' }}>
                      {sub.currency === 'INR' ? '₹' : sub.currency}{parseFloat(sub.cost).toFixed(2)}
                      <span className="text-[10px] font-medium ml-1 capitalize" style={{ color: '#475569' }}>
                        /{sub.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5"
                    style={{ background: u.badge, border: `1px solid ${u.border}`, color: u.color }}>
                    <Clock className="h-3 w-3" />
                    {info.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-56 flex flex-col items-center justify-center rounded-3xl max-w-4xl"
          style={{ border: '1px dashed rgba(16,185,129,0.3)' }}>
          <CheckCircle2 className="h-10 w-10 mb-3" style={{ color: '#10b981' }} />
          <h3 className="text-sm font-bold" style={{ color: '#e2eaf5' }}>No Upcoming Renewals</h3>
          <p className="text-xs mt-1 text-center max-w-[240px]" style={{ color: '#475569' }}>
            You have no active subscriptions, or all your subscriptions are inactive.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reminders;
