import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  PiggyBank, 
  Loader2, 
  ArrowUpRight, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#a855f7', '#10b981', '#06b6d4', '#f59e0b'];

const Dashboard = ({ setCurrentPage }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await client.get('/api/subscriptions/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        setError('Could not load dashboard summary data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm font-medium">Analyzing expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-slate-950 h-full text-slate-200">
        <div className="max-w-md mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center mt-12">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Error Loading Dashboard</h3>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Pre-process chart data
  const hasData = summary && summary.categoryBreakdown && summary.categoryBreakdown.length > 0;
  
  const chartData = hasData 
    ? summary.categoryBreakdown.map(item => ({
        name: item.category,
        value: item.monthlyCost,
        annual: item.annualCost
      }))
    : [];

  const barChartData = chartData;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-slate-300">{payload[0].name}</p>
          <p className="text-sm font-bold text-white mt-1">₹{payload[0].value.toFixed(2)}/mo</p>
          <p className="text-[10px] text-slate-400">₹{payload[0].payload.annual.toFixed(2)}/yr</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 bg-slate-950 text-slate-200 min-h-screen">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Spend Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time spend analysis and optimization insights</p>
        </div>
        <button 
          onClick={() => setCurrentPage('subscriptions')}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium text-sm transition-all duration-300 hover:brightness-110 shadow-lg shadow-indigo-600/15 active:scale-[0.98] group cursor-pointer"
        >
          Manage Subscriptions
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </header>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Monthly Total */}
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl group-hover:bg-indigo-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Spend</span>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">₹{summary?.monthlyTotal.toLocaleString('en-IN') || 0}</span>
            <span className="text-xs text-slate-400 font-medium">/ month</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            Aggregated active recurring items
          </p>
        </div>

        {/* Annual Total */}
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full filter blur-xl group-hover:bg-purple-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected Annual Cost</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">₹{summary?.annualTotal.toLocaleString('en-IN') || 0}</span>
            <span className="text-xs text-slate-400 font-medium">/ year</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Based on current pricing cycles</p>
        </div>

        {/* Unused Count */}
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl group-hover:bg-amber-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unused Subscriptions</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">{summary?.unusedCount || 0}</span>
            <span className="text-xs text-slate-400 font-medium">items idle</span>
          </div>
          <p className="text-[11px] text-amber-400/80 mt-2 font-medium">No usage recorded in 30+ days</p>
        </div>

        {/* Potential Savings */}
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl group-hover:bg-emerald-500/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Potential Savings</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-400">₹{summary?.potentialSavingsAnnually.toLocaleString('en-IN') || 0}</span>
            <span className="text-xs text-slate-400 font-medium">/ year</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">By canceling all flagged idle items</p>
        </div>
      </section>

      {/* Analytics Charts section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown list & donut chart */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">Spend by Category</h3>
            <p className="text-xs text-slate-500 mb-6">Monthly expenditure partitioned across functional categories</p>
          </div>

          {hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-60 relative flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white">₹{summary?.monthlyTotal.toFixed(0)}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total / mo</span>
                </div>
              </div>

              {/* Custom Legend details */}
              <div className="space-y-3">
                {summary.categoryBreakdown.map((item, idx) => (
                  <div key={item.category} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/20 transition-all">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-sm font-semibold text-slate-300">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">₹{item.monthlyCost.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-6">
              <p className="text-slate-500 text-sm font-medium mb-1">No active subscriptions yet</p>
              <button 
                onClick={() => setCurrentPage('subscriptions')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                Create your first subscription <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Potential Savings Panel */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">Savings Opportunities</h3>
            <p className="text-xs text-slate-500 mb-6">Subscriptions with low activity that can be deactivated</p>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-4">
            {summary?.unusedCount > 0 ? (
              <>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-400">Idle Items Found</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      You have {summary.unusedCount} subscription{summary.unusedCount > 1 ? 's' : ''} that haven't been used in over 30 days.
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Optimized Budget Plan</span>
                  </div>
                  <p className="text-2xl font-black text-white">₹{summary.potentialSavingsMonthly.toFixed(2)}/mo</p>
                  <p className="text-[10px] text-slate-400">Immediate reduction in monthly overheads</p>
                </div>
              </>
            ) : (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl">
                <span className="text-2xl">🎉</span>
                <h4 className="text-sm font-bold text-slate-300 mt-2">All Clear!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                  Every subscription is actively utilized. High utility efficiency.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentPage('subscriptions')}
            className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/30 text-slate-200 hover:text-white rounded-xl font-medium text-xs transition-colors cursor-pointer"
          >
            Review Usage logs
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
