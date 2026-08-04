import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, Calendar, AlertTriangle, PiggyBank, ArrowRight, ShieldAlert, 
  Flame, Target, Edit3, Check, X, BellRing, Loader2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const COLORS = ['#7c3aed','#06b6d4','#f59e0b','#10b981','#f43f5e','#a78bfa'];

const StatCard = ({ label, value, sub, icon: Icon, accentClass, iconBg, delay = 0, onClick }) => (
  <div 
    onClick={onClick}
    className={`glass-card p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5 ${accentClass} animate-slide-up ${onClick ? 'cursor-pointer' : ''}`}
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
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: iconBg, filter:'blur(20px)' }} />
  </div>
);

const Dashboard = ({ setCurrentPage }) => {
  const { user, updateUserBudget } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await client.get('/api/subscriptions/summary');
      setSummary(res.data);
    } catch (err) {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setBudgetSubmitting(true);
    const res = await updateUserBudget(budgetInput);
    setBudgetSubmitting(false);
    if (res.success) {
      setIsBudgetModalOpen(false);
      fetchSummary();
    }
  };

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center mesh-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full animate-spin-slow" style={{ background:'conic-gradient(from 0deg, #7c3aed, #06b6d4, #7c3aed)' }} />
        <p className="text-sm font-medium" style={{ color:'#64748b' }}>Analyzing expenses & budget trends…</p>
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
  const monthlyBudget = user?.monthly_budget || summary?.monthlyBudget || 0;
  const monthlyTotal = summary?.monthlyTotal || 0;
  const budgetExceeded = monthlyBudget > 0 && monthlyTotal > monthlyBudget;
  const budgetUsagePercent = monthlyBudget > 0 ? Math.min(Math.round((monthlyTotal / monthlyBudget) * 100), 100) : 0;

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload?.length) return (
      <div className="glass-card p-3 shadow-xl text-xs">
        <p className="font-bold" style={{ color:'#e2eaf5' }}>{payload[0].name}</p>
        <p className="mt-1" style={{ color:'#06b6d4' }}>₹{payload[0].value?.toFixed(2)}/mo</p>
        <p style={{ color:'#64748b' }}>₹{payload[0].payload?.annual?.toFixed(2)}/yr</p>
      </div>
    );
    return null;
  };

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="glass-card p-3 shadow-xl text-xs">
        <p className="font-bold" style={{ color:'#e2eaf5' }}>{label}</p>
        <p className="mt-1 font-semibold" style={{ color:'#7c3aed' }}>Spend: ₹{payload[0].value?.toFixed(2)}</p>
        {payload[1] && <p className="font-semibold" style={{ color:'#06b6d4' }}>Cap: ₹{payload[1].value?.toFixed(2)}</p>}
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
          <p className="text-sm mt-1" style={{ color:'#475569' }}>Real-time expense telemetry & budget intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setBudgetInput(monthlyBudget.toString()); setIsBudgetModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.3)', color:'#a78bfa' }}>
            <Target className="h-4 w-4" />
            {monthlyBudget > 0 ? `Budget Cap: ₹${monthlyBudget}` : 'Set Budget Cap'}
          </button>
          <button onClick={() => setCurrentPage('subscriptions')} className="btn-primary flex items-center gap-2 group">
            Manage Subscriptions
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* Budget Exceeded Warning Banner */}
      {budgetExceeded && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between gap-4 animate-slide-up"
          style={{ background:'rgba(244,63,94,0.08)', borderColor:'rgba(244,63,94,0.3)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background:'rgba(244,63,94,0.2)', color:'#f43f5e' }}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color:'#fda4af' }}>Monthly Budget Exceeded</h4>
              <p className="text-xs mt-0.5" style={{ color:'#94a3b8' }}>
                Your active monthly spend of <strong style={{ color:'#e2eaf5' }}>₹{monthlyTotal}</strong> exceeds your monthly cap of <strong style={{ color:'#e2eaf5' }}>₹{monthlyBudget}</strong> by <strong style={{ color:'#f43f5e' }}>₹{(monthlyTotal - monthlyBudget).toFixed(2)}</strong>.
              </p>
            </div>
          </div>
          <button onClick={() => { setBudgetInput(monthlyBudget.toString()); setIsBudgetModalOpen(true); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
            Adjust Cap
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8 stagger-children">
        <StatCard label="Monthly Spend" icon={TrendingUp}
          value={`₹${(summary?.monthlyTotal || 0).toLocaleString('en-IN')}`}
          sub={monthlyBudget > 0 ? `${budgetUsagePercent}% of ₹${monthlyBudget} budget cap` : 'Aggregated active items'} 
          accentClass="stat-card-violet"
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

      {/* Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 6-Month Spend Trend AreaChart */}
        <div className="lg:col-span-2 glass-card p-6 animate-slide-up" style={{ animationDelay:'320ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold" style={{ color:'#e2eaf5' }}>Spend Trajectory & Trend</h3>
              <p className="text-xs" style={{ color:'#475569' }}>6-month active subscription spend vs monthly budget cap</p>
            </div>
            {monthlyBudget > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: budgetExceeded ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)', color: budgetExceeded ? '#f43f5e' : '#10b981', border: `1px solid ${budgetExceeded ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                {budgetExceeded ? 'Over Cap' : 'Within Cap'}
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.spendTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTrendTooltip />} />
                <Area type="monotone" dataKey="spend" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#spendGradient)" name="Spend" />
                {monthlyBudget > 0 && (
                  <Area type="monotone" dataKey="budget" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#budgetGradient)" name="Budget Cap" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category Donut */}
        <div className="glass-card p-6 flex flex-col animate-slide-up" style={{ animationDelay:'400ms' }}>
          <h3 className="text-lg font-bold mb-1" style={{ color:'#e2eaf5' }}>Spend by Category</h3>
          <p className="text-xs mb-4" style={{ color:'#475569' }}>Monthly expenditure breakdown</p>
          {hasData ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-44 relative flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {summary.categoryBreakdown.slice(0, 4).map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between text-xs p-1.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium" style={{ color:'#cbd5e1' }}>{item.category}</span>
                    </div>
                    <span className="font-bold" style={{ color:'#e2eaf5' }}>₹{item.monthlyCost.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center rounded-2xl" style={{ border:'1px dashed rgba(30,58,95,0.6)' }}>
              <p className="text-xs" style={{ color:'#475569' }}>No data available</p>
            </div>
          )}
        </div>
      </section>

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background:'rgba(8,12,20,0.85)', backdropFilter:'blur(12px)' }}>
          <div className="w-full max-w-sm glass-card p-6 shadow-2xl relative animate-fade-scale">
            <button onClick={() => setIsBudgetModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl" style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa' }}>
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold" style={{ color:'#e2eaf5' }}>Monthly Budget Cap</h3>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color:'#64748b' }}>
                  Target Monthly Limit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 3000.00"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  className="input-field w-full py-2.5 px-4 text-sm"
                  style={{ color:'#e2eaf5' }}
                  required
                />
                <span className="text-[10px] mt-1 block" style={{ color:'#64748b' }}>
                  Set to 0 to disable monthly budget tracking.
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-3" style={{ borderTop:'1px solid rgba(30,58,95,0.5)' }}>
                <button type="button" onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ background:'rgba(30,58,95,0.4)', color:'#94a3b8' }}>
                  Cancel
                </button>
                <button type="submit" disabled={budgetSubmitting} className="btn-primary flex items-center gap-1.5 px-5 py-2 text-xs">
                  {budgetSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5" /> Save Cap</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
