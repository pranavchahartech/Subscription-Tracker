import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { Plus, Search, Filter, Edit2, Trash2, AlertCircle, Loader2, X, Calendar, Check, AlertTriangle, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Entertainment','Utilities','Software','Health & Fitness','Business','Other'];
const CURRENCIES = ['INR','USD','EUR','GBP'];

const getStatusStyle = (status) => {
  const map = {
    Active:   { bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.3)',  color:'#10b981' },
    Unused:   { bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.3)',  color:'#f59e0b' },
    Review:   { bg:'rgba(124,58,237,0.12)',  border:'rgba(124,58,237,0.3)',  color:'#a78bfa' },
    Inactive: { bg:'rgba(100,116,139,0.12)', border:'rgba(100,116,139,0.3)', color:'#64748b' },
  };
  return map[status] || map.Inactive;
};

const SkeletonRow = () => (
  <tr>
    {[...Array(7)].map((_, i) => (
      <td key={i} className="p-4 pl-6"><div className="skeleton h-4 w-full" style={{ animationDelay: `${i * 60}ms` }} /></td>
    ))}
  </tr>
);

const Subscriptions = () => {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name:'', cost:'', currency:'INR', billing_cycle:'monthly',
    category:'Entertainment', start_date:'', next_renewal:'', last_used_date:'', is_active:true
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  const fetchSubscriptions = async () => {
    try { setLoading(true); const res = await client.get('/api/subscriptions'); setSubscriptions(res.data); }
    catch { setError('Failed to fetch subscriptions.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchSubscriptions(); }, []);

  const handleOpenAddModal = () => {
    setEditingSub(null);
    const today = new Date().toISOString().split('T')[0];
    const in30 = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
    setFormData({ name:'', cost:'', currency:'INR', billing_cycle:'monthly', category:'Entertainment', start_date:today, next_renewal:in30, last_used_date:today, is_active:true });
    setFormError(''); setIsModalOpen(true);
  };
  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    setFormData({ name:sub.name, cost:sub.cost, currency:sub.currency, billing_cycle:sub.billing_cycle,
      category:sub.category, start_date:sub.start_date?.split('T')[0]||'',
      next_renewal:sub.next_renewal?.split('T')[0]||'',
      last_used_date:sub.last_used_date?.split('T')[0]||'', is_active:sub.is_active });
    setFormError(''); setIsModalOpen(true);
  };
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type==='checkbox' ? checked : value }));
  };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.cost || !formData.start_date || !formData.next_renewal)
      return setFormError('Please fill in all required fields.');
    if (parseFloat(formData.cost) <= 0) return setFormError('Cost must be greater than zero.');
    try {
      setFormSubmitting(true); setFormError('');
      const data = { ...formData, cost: parseFloat(formData.cost), last_used_date: formData.last_used_date||null };
      editingSub ? await client.put(`/api/subscriptions/${editingSub.id}`, data) : await client.post('/api/subscriptions', data);
      setIsModalOpen(false); fetchSubscriptions();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error saving subscription.');
    } finally { setFormSubmitting(false); }
  };
  const handleDelete = async () => {
    if (!subToDelete) return;
    setLoading(true);
    try { await client.delete(`/api/subscriptions/${subToDelete.id}`); setIsDeleteConfirmOpen(false); setSubToDelete(null); fetchSubscriptions(); }
    catch { setError('Failed to delete subscription.'); setLoading(false); }
  };
  const handleExportCsv = async () => {
    setCsvLoading(true);
    try {
      const res = await client.get('/api/subscriptions/export/csv', { responseType:'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type:'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'subspace-subscriptions.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { setError('Failed to export CSV.'); }
    finally { setCsvLoading(false); }
  };

  const filtered = subscriptions.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter==='All'||s.status===statusFilter) && (categoryFilter==='All'||s.category===categoryFilter);
  });

  return (
    <div className="p-8 mesh-bg min-h-screen page-enter" style={{ color:'#e2eaf5' }}>
      {/* Header */}
      <header className="mb-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">Your Subscriptions</h1>
          <p className="text-sm mt-1" style={{ color:'#475569' }}>Manage and audit all recurring payments</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCsv} disabled={csvLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', color:'#10b981' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(16,185,129,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(16,185,129,0.12)'}>
            {csvLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </button>
          <button onClick={handleOpenAddModal} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Subscription
          </button>
        </div>
      </header>

      {/* Search & Filters */}
      <section className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4" style={{ color:'#475569' }} />
          <input type="text" placeholder="Search name or category…" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field w-full py-2.5 pl-10 pr-4 text-sm" style={{ color:'#e2eaf5', borderRadius:'0.75rem' }} />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {[['Status', statusFilter, setStatusFilter, ['All','Active','Unused','Review','Inactive']],
            ['Category', categoryFilter, setCategoryFilter, ['All',...CATEGORIES]]].map(([label, val, setter, opts]) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background:'rgba(13,21,38,0.6)', border:'1px solid rgba(30,58,95,0.6)', color:'#64748b' }}>
              <Filter className="h-3.5 w-3.5" />
              <span>{label}:</span>
              <select value={val} onChange={e => setter(e.target.value)}
                className="bg-transparent font-medium outline-none cursor-pointer" style={{ color:'#e2eaf5' }}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="text-sm rounded-xl p-4 mb-5 flex items-center gap-2"
          style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)', color:'#fda4af' }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead style={{ borderBottom:'1px solid rgba(30,58,95,0.6)' }}>
                <tr>
                  {['Subscription','Cost','Billing Cycle','Category','Next Renewal','Status','Actions'].map(h => (
                    <th key={h} className="p-4 text-xs font-bold uppercase tracking-wider pl-6" style={{ color:'#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead style={{ borderBottom:'1px solid rgba(30,58,95,0.6)', background:'rgba(13,21,38,0.6)' }}>
                <tr>
                  {['Subscription','Cost','Billing','Category','Next Renewal','Status','Actions'].map(h => (
                    <th key={h} className="p-4 text-xs font-bold uppercase tracking-wider pl-6" style={{ color:'#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, idx) => {
                  const st = getStatusStyle(sub.status);
                  return (
                    <tr key={sub.id} className="group transition-all duration-200 animate-slide-up"
                      style={{ borderBottom:'1px solid rgba(30,58,95,0.3)', animationDelay:`${idx*40}ms` }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(124,58,237,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.2))', border:'1px solid rgba(124,58,237,0.2)', color:'#a78bfa' }}>
                            {sub.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color:'#e2eaf5' }}>{sub.name}</p>
                            <p className="text-[10px] font-mono" style={{ color:'#475569' }}>
                              Since {new Date(sub.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-sm" style={{ color:'#e2eaf5' }}>
                        {sub.currency === 'INR' ? '₹' : sub.currency}{parseFloat(sub.cost).toFixed(2)}
                      </td>
                      <td className="p-4 text-xs font-medium capitalize" style={{ color:'#94a3b8' }}>{sub.billing_cycle}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background:'rgba(30,58,95,0.4)', border:'1px solid rgba(30,58,95,0.6)', color:'#94a3b8' }}>
                          {sub.category}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-medium" style={{ color:'#94a3b8' }}>
                        {new Date(sub.next_renewal).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                          style={{ background:st.bg, border:`1px solid ${st.border}`, color:st.color }}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button onClick={() => handleOpenEditModal(sub)} title="Edit"
                            className="p-1.5 rounded-lg transition-all duration-200"
                            style={{ border:'1px solid rgba(30,58,95,0.6)', color:'#475569' }}
                            onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.15)'; e.currentTarget.style.color='#a78bfa'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#475569'; }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => { setSubToDelete(sub); setIsDeleteConfirmOpen(true); }} title="Delete"
                            className="p-1.5 rounded-lg transition-all duration-200"
                            style={{ border:'1px solid rgba(30,58,95,0.6)', color:'#475569' }}
                            onMouseEnter={e => { e.currentTarget.style.background='rgba(244,63,94,0.15)'; e.currentTarget.style.color='#f43f5e'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#475569'; }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center rounded-3xl"
          style={{ border:'1px dashed rgba(30,58,95,0.6)' }}>
          <p className="text-sm font-medium" style={{ color:'#475569' }}>No matching subscriptions</p>
          <p className="text-xs mt-1" style={{ color:'#334155' }}>Try adjusting your filters or add a new subscription.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background:'rgba(8,12,20,0.85)', backdropFilter:'blur(12px)' }}>
          <div className="w-full max-w-lg glass-card p-7 shadow-2xl relative animate-fade-scale"
            style={{ boxShadow:'0 0 60px rgba(124,58,237,0.15), 0 24px 48px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 rounded-lg transition-colors" style={{ color:'#475569' }}
              onMouseEnter={e => e.currentTarget.style.color='#e2eaf5'}
              onMouseLeave={e => e.currentTarget.style.color='#475569'}>
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold mb-5 gradient-text">
              {editingSub ? 'Edit Subscription' : 'New Subscription'}
            </h3>
            {formError && (
              <div className="text-xs rounded-xl p-3 mb-4 animate-slide-up"
                style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.25)', color:'#fda4af' }}>
                {formError}
              </div>
            )}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color:'#64748b' }}>
                  Subscription Name *
                </label>
                <input type="text" name="name" required placeholder="e.g. Netflix, AWS, Spotify"
                  value={formData.name} onChange={handleFormChange}
                  className="input-field w-full py-2.5 px-4 text-sm" style={{ color:'#e2eaf5' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[['Cost *','cost','number','299.00'],['Billing Cycle','billing_cycle','select',null],
                ].map(([lbl, name, type, ph]) => (
                  <div key={name}>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color:'#64748b' }}>{lbl}</label>
                    {type === 'select' ? (
                      <select name={name} value={formData[name]} onChange={handleFormChange}
                        className="input-field w-full py-2.5 px-4 text-sm" style={{ color:'#e2eaf5' }}>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    ) : (
                      <input type={type} name={name} required step="0.01" min="0.01" placeholder={ph}
                        value={formData[name]} onChange={handleFormChange}
                        className="input-field w-full py-2.5 px-4 text-sm" style={{ color:'#e2eaf5' }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color:'#64748b' }}>Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleFormChange}
                    className="input-field w-full py-2.5 px-4 text-sm" style={{ color:'#e2eaf5' }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color:'#64748b' }}>Category</label>
                  <select name="category" value={formData.category} onChange={handleFormChange}
                    className="input-field w-full py-2.5 px-4 text-sm" style={{ color:'#e2eaf5' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[['Start Date *','start_date'],['Next Renewal *','next_renewal']].map(([lbl, name]) => (
                  <div key={name}>
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color:'#64748b' }}>{lbl}</label>
                    <input type="date" name={name} required value={formData[name]} onChange={handleFormChange}
                      className="input-field w-full py-2.5 px-4 text-sm" style={{ color:'#e2eaf5' }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color:'#64748b' }}>
                  Last Used Date <span className="normal-case font-normal" style={{ color:'#334155' }}>(optional)</span>
                </label>
                <input type="date" name="last_used_date" value={formData.last_used_date} onChange={handleFormChange}
                  className="input-field w-full py-2.5 px-4 text-sm" style={{ color:'#e2eaf5' }} />
              </div>
              <div className="flex items-center gap-2.5 py-1">
                <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleFormChange}
                  className="h-4 w-4 rounded" style={{ accentColor:'#7c3aed' }} />
                <label htmlFor="is_active" className="text-xs font-medium cursor-pointer" style={{ color:'#94a3b8' }}>
                  Active — include in spend totals and reminders
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4" style={{ borderTop:'1px solid rgba(30,58,95,0.5)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background:'rgba(30,58,95,0.4)', color:'#94a3b8', border:'1px solid rgba(30,58,95,0.6)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={formSubmitting}
                  className="btn-primary flex items-center gap-1.5 px-5 py-2.5 text-xs disabled:opacity-50">
                  {formSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5" /> Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background:'rgba(8,12,20,0.85)', backdropFilter:'blur(12px)' }}>
          <div className="w-full max-w-sm glass-card p-7 shadow-2xl text-center animate-fade-scale"
            style={{ boxShadow:'0 0 60px rgba(244,63,94,0.1), 0 24px 48px rgba(0,0,0,0.5)' }}>
            <div className="p-4 rounded-2xl inline-block mb-4" style={{ background:'rgba(244,63,94,0.1)' }}>
              <AlertTriangle className="h-8 w-8" style={{ color:'#f43f5e' }} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color:'#e2eaf5' }}>Delete Subscription?</h3>
            <p className="text-sm mb-6" style={{ color:'#64748b' }}>
              This will permanently delete <span className="font-bold" style={{ color:'#e2eaf5' }}>"{subToDelete?.name}"</span>. This cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background:'rgba(30,58,95,0.4)', color:'#94a3b8', border:'1px solid rgba(30,58,95,0.6)' }}>
                Cancel
              </button>
              <button onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                style={{ background:'linear-gradient(135deg,#f43f5e,#e11d48)', boxShadow:'0 4px 16px rgba(244,63,94,0.3)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
