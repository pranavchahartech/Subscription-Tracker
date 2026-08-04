import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { TrendingUp, Calendar, AlertTriangle, PiggyBank, Loader2, ArrowRight, ShieldAlert, Flame } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#7c3aed','#06b6d4','#f59e0b','#10b981','#f43f5e','#a78bfa'];

const StatCard = ({ label, value, sub, icon: Icon, accentClass, iconBg, delay = 0 }) => (
  <div className={`glass-card p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5 ${accentClass} animate-slide-up`}
    style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color:'#64748b' }}>{label}</span>
      <div className="p-2.5 rounded-xl" style={{ background: iconBg }}>
        <Icon className="h-4.5 w-4.5" style={{ height:'1.125rem', width:'1.125rem', color:'white' }} />
      </div>
    </div>
    <div className="animate-count">
      <p className="text-3xl font-extrabold" style={{ color:'#e2eaf5' }}>{value}</p>
      <p className="text-xs mt-2 font-medium" style={{ color:'#475569' }}>{sub}</p>
    </div>
    {/* Corner glow */}
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: iconBg, filter:'blur(20px)' }} />
  </div>
);

const Dashboard = ({ setCurrentPage }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/api/subscriptions/summary')
      .then(res => setSummary(res.data))
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center mesh-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full animate-spin-slow" style={{ background:'conic-gradient(from 0deg, #7c3aed, #06b6d4, #7c3aed)' }} />
        <p className="text-sm font-medium" style={{ color:'#64748b' }}>Analyzing expenses…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-8 mesh-bg min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <ShieldAlert className="h-10 w-10 mx-auto mb-4" style={{ color:'#f43f5e' }} />
        <h3 className="font-bold text-lg mb-2" style={{ color:'#e2eaf5' }}>Error Loading Dashboard</h3>
        <p className="text-sm mb-5" style={{ color:'#64748b' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    </div>
  );

  const hasData = summary?.categoryBreakdown?.length > 0;
  const chartData = hasData ? summary.categoryBreakdown.map(i => ({ name: i.category, value: i.monthlyCost, annual: i.annualCost })) : [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) return (
      <div className="glass-card p-3 shadow-xl text-xs">
        <p className="font-bold" style={{ color:'#e2eaf5' }}>{payload[0].name}</p>
        <p className="mt-1" style={{ color:'#06b6d4' }}>₹{payload[0].value?.toFixed(2)}/mo</p>
        <p style={{ color:'#64748b' }}>₹{payload[0].payload?.annual?.toFixed(2)}/yr</p>
      </div>
    );
    return null;
  };

  return (
    <div className="p-8 mesh-bg min-h-screen page-enter">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">Spend Dashboard</h1>
          <p className="text-sm mt-1" style={{ color:'#475569' }}>Real-time analysis of your recurring expenses</p>
        </div>
        <button onClick={() => setCurrentPage('subscriptions')}
          className="btn-primary flex items-center gap-2 group">
          Manage Subscriptions
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </header>

      {/* Stat Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8 stagger-children">
        <StatCard label="Monthly Spend" icon={TrendingUp}
          value={`₹${(summary?.monthlyTotal || 0).toLocaleString('en-IN')}`}
          sub="Aggregated active items" accentClass="stat-card-violet"
          iconBg="linear-gradient(135deg,#7c3aed,#a78bfa)" delay={0} />
        <StatCard label="Projected Annual" icon={Calendar}
          value={`₹${(summary?.annualTotal || 0).toLocaleString('en-IN')}`}
          sub="Based on current cycles" accentClass="stat-card-cyan"
          iconBg="linear-gradient(135deg,#06b6d4,#0ea5e9)" delay={80} />
        <StatCard label="Idle Subscriptions" icon={AlertTriangle}
          value={summary?.unusedCount || 0}
          sub="No usage in 30+ days" accentClass="stat-card-amber"
          iconBg="linear-gradient(135deg,#f59e0b,#fb923c)" delay={160} />
        <StatCard label="Potential Savings" icon={PiggyBank}
          value={`₹${(summary?.potentialSavingsAnnually || 0).toLocaleString('en-IN')}`}
          sub="By canceling idle items / yr" accentClass="stat-card-emerald"
          iconBg="linear-gradient(135deg,#10b981,#06b6d4)" delay={240} />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut + legend */}
        <div className="lg:col-span-2 glass-card p-6 animate-slide-up" style={{ animationDelay:'320ms' }}>
          <h3 className="text-lg font-bold mb-1" style={{ color:'#e2eaf5' }}>Spend by Category</h3>
          <p className="text-xs mb-5" style={{ color:'#475569' }}>Monthly expenditure across categories</p>
          {hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-60 relative flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={62} outerRadius={88}
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black" style={{ color:'#e2eaf5' }}>₹{summary?.monthlyTotal?.toFixed(0)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#475569' }}>/ month</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {summary.categoryBreakdown.map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 hover:bg-white/5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-semibold" style={{ color:'#cbd5e1' }}>{item.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color:'#e2eaf5' }}>₹{item.monthlyCost.toFixed(0)}</p>
                      <p className="text-[10px] font-mono" style={{ color:'#475569' }}>{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center rounded-2xl"
              style={{ border:'1px dashed rgba(30,58,95,0.6)' }}>
              <p className="text-sm font-medium" style={{ color:'#475569' }}>No active subscriptions yet</p>
              <button onClick={() => setCurrentPage('subscriptions')}
                className="text-xs font-semibold mt-2 transition-colors" style={{ color:'#7c3aed' }}>
                Add your first →
              </button>
            </div>
          )}
        </div>

        {/* Savings panel */}
        <div className="glass-card p-6 flex flex-col animate-slide-up" style={{ animationDelay:'400ms' }}>
          <h3 className="text-lg font-bold mb-1" style={{ color:'#e2eaf5' }}>Savings Opportunities</h3>
          <p className="text-xs mb-5" style={{ color:'#475569' }}>Low-activity subscriptions to review</p>
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {summary?.unusedCount > 0 ? (
              <>
                <div className="p-4 rounded-2xl flex gap-3"
                  style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
                  <Flame className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color:'#f59e0b' }} />
                  <div>
                    <h4 className="text-sm font-bold" style={{ color:'#fbbf24' }}>Idle Items Found</h4>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color:'#94a3b8' }}>
                      {summary.unusedCount} subscription{summary.unusedCount > 1 ? 's' : ''} haven't been used in 30+ days.
                    </p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl" style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="h-4 w-4" style={{ color:'#10b981' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'#10b981' }}>Recovery Potential</span>
                  </div>
                  <p className="text-2xl font-black" style={{ color:'#e2eaf5' }}>₹{summary.potentialSavingsMonthly.toFixed(0)}/mo</p>
                  <p className="text-[10px] mt-1" style={{ color:'#475569' }}>Immediate monthly reduction</p>
                </div>
              </>
            ) : (
              <div className="py-8 text-center rounded-2xl" style={{ border:'1px dashed rgba(16,185,129,0.3)' }}>
                <span className="text-3xl">🎉</span>
                <h4 className="text-sm font-bold mt-3" style={{ color:'#e2eaf5' }}>All Clear!</h4>
                <p className="text-xs mt-1 max-w-[180px] mx-auto" style={{ color:'#475569' }}>
                  Every subscription is actively used. Excellent efficiency.
                </p>
              </div>
            )}
          </div>
          <button onClick={() => setCurrentPage('subscriptions')}
            className="mt-5 w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background:'rgba(30,58,95,0.4)', color:'#94a3b8', border:'1px solid rgba(30,58,95,0.6)' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.15)'; e.currentTarget.style.color='#e2eaf5'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(30,58,95,0.4)'; e.currentTarget.style.color='#94a3b8'; }}>
            Review All Subscriptions →
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
