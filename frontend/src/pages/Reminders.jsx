import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Bell, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const Reminders = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/subscriptions');
      // Filter active subscriptions only and sort by renewal date
      const activeSubs = res.data
        .filter(sub => sub.is_active)
        .sort((a, b) => new Date(a.next_renewal) - new Date(b.next_renewal));
      setSubscriptions(activeSubs);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to fetch renewal timelines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const getRenewalInfo = (nextRenewalDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(nextRenewalDate);
    renewal.setHours(0, 0, 0, 0);

    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: diffDays, text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`, urgency: 'critical' };
    }
    if (diffDays === 0) {
      return { days: 0, text: 'Renews Today', urgency: 'critical' };
    }
    if (diffDays === 1) {
      return { days: 1, text: 'Renews Tomorrow', urgency: 'high' };
    }
    if (diffDays <= 3) {
      return { days: diffDays, text: `Renews in ${diffDays} days`, urgency: 'high' };
    }
    if (diffDays <= 7) {
      return { days: diffDays, text: `Renews in ${diffDays} days`, urgency: 'medium' };
    }
    return { days: diffDays, text: `Renews in ${diffDays} days`, urgency: 'low' };
  };

  const getUrgencyStyles = (urgency) => {
    switch (urgency) {
      case 'critical':
        return {
          card: 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50 shadow-rose-500/5 shadow-lg',
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          icon: 'text-rose-400'
        };
      case 'high':
        return {
          card: 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40 shadow-rose-500/5',
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          icon: 'text-rose-400'
        };
      case 'medium':
        return {
          card: 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 shadow-amber-500/5',
          badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          icon: 'text-amber-400'
        };
      case 'low':
      default:
        return {
          card: 'border-indigo-500/10 bg-indigo-500/5 hover:border-indigo-500/30 shadow-indigo-500/5',
          badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
          icon: 'text-indigo-455'
        };
    }
  };

  return (
    <div className="p-8 bg-slate-950 text-slate-200 min-h-screen">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Renewal Reminders
        </h1>
        <p className="text-slate-400 text-sm mt-1">Countdown timeline for active recurring bills</p>
      </header>

      {/* Info Notice banner */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl mb-8 flex items-start gap-3">
        <Bell className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-slate-200">Daily Email Reminders Active</h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Our automated reminder job runs every day to analyze upcoming payments. Subscriptions renewing in the next 7 days will automatically trigger email alerts to your account address.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl p-4 mb-6 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main List Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="space-y-4 max-w-4xl">
          {subscriptions.map((sub) => {
            const renewalInfo = getRenewalInfo(sub.next_renewal);
            const style = getUrgencyStyles(renewalInfo.urgency);

            return (
              <div 
                key={sub.id} 
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${style.card}`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-slate-300">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{sub.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono">
                      <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-900 rounded text-slate-400 capitalize">{sub.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {new Date(sub.next_renewal).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-left sm:text-right">Price</p>
                    <p className="font-extrabold text-white text-sm mt-0.5">
                      {sub.currency === 'INR' ? '₹' : sub.currency} {parseFloat(sub.cost).toFixed(2)}
                      <span className="text-[10px] text-slate-500 font-medium capitalize"> / {sub.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase flex items-center gap-1 ${style.badge}`}>
                      <Clock className="h-3.5 w-3.5" />
                      {renewalInfo.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl p-8 bg-slate-900/10 max-w-4xl">
          <CheckCircle2 className="h-10 w-10 text-emerald-500/80 mb-3" />
          <h3 className="text-slate-350 text-sm font-bold">No Upcoming Renewals</h3>
          <p className="text-slate-550 text-xs text-center max-w-[280px] mt-1">
            Excellent! You have no active subscription renewals, or all your subscriptions are currently set to inactive.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reminders;
