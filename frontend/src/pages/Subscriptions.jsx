import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  X, 
  Calendar, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

const CATEGORIES = ['Entertainment', 'Utilities', 'Software', 'Health & Fitness', 'Business', 'Other'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    currency: 'INR',
    billing_cycle: 'monthly',
    category: 'Entertainment',
    start_date: '',
    next_renewal: '',
    last_used_date: '',
    is_active: true
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/subscriptions');
      setSubscriptions(res.data);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to fetch subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleOpenAddModal = () => {
    setEditingSub(null);
    setFormData({
      name: '',
      cost: '',
      currency: 'INR',
      billing_cycle: 'monthly',
      category: 'Entertainment',
      start_date: new Date().toISOString().split('T')[0],
      next_renewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days later
      last_used_date: new Date().toISOString().split('T')[0],
      is_active: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      cost: sub.cost,
      currency: sub.currency,
      billing_cycle: sub.billing_cycle,
      category: sub.category,
      start_date: sub.start_date ? sub.start_date.split('T')[0] : '',
      next_renewal: sub.next_renewal ? sub.next_renewal.split('T')[0] : '',
      last_used_date: sub.last_used_date ? sub.last_used_date.split('T')[0] : '',
      is_active: sub.is_active
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenDeleteConfirm = (sub) => {
    setSubToDelete(sub);
    setIsDeleteConfirmOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.cost || !formData.start_date || !formData.next_renewal) {
      return setFormError('Please fill in all required fields.');
    }
    if (parseFloat(formData.cost) <= 0) {
      return setFormError('Cost must be greater than zero.');
    }

    try {
      setFormSubmitting(true);
      setFormError('');
      
      const parsedData = {
        ...formData,
        cost: parseFloat(formData.cost),
        last_used_date: formData.last_used_date || null
      };

      if (editingSub) {
        await client.put(`/api/subscriptions/${editingSub.id}`, parsedData);
      } else {
        await client.post('/api/subscriptions', parsedData);
      }

      setIsModalOpen(false);
      fetchSubscriptions();
    } catch (err) {
      console.error('Error saving subscription:', err);
      setFormError(err.response?.data?.error || 'Error saving subscription.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!subToDelete) return;
      setLoading(true);
      await client.delete(`/api/subscriptions/${subToDelete.id}`);
      setIsDeleteConfirmOpen(false);
      setSubToDelete(null);
      fetchSubscriptions();
    } catch (err) {
      console.error('Error deleting subscription:', err);
      setError('Failed to delete subscription.');
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(search.toLowerCase()) || 
                          sub.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || sub.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Unused':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Review':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Inactive':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="p-8 bg-slate-950 text-slate-200 min-h-screen">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Your Subscriptions
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage and audit all recurring payments</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg shadow-indigo-600/10 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add Subscription
        </button>
      </header>

      {/* Search & Filter Toolbar */}
      <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search subscriptions or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer focus:text-indigo-400"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Unused">Unused</option>
              <option value="Review">Review</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium outline-none cursor-pointer focus:text-indigo-400"
            >
              <option value="All">All</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main List Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredSubs.length > 0 ? (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider pl-6">Subscription</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cost</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Cycle</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Next Renewal</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-900/20 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700/30">
                          {sub.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{sub.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Started: {new Date(sub.start_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white text-sm">
                      {sub.currency === 'INR' ? '₹' : sub.currency} {parseFloat(sub.cost).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-slate-300 capitalize">{sub.billing_cycle}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-850 border border-slate-800 text-slate-400 rounded-full text-xs font-medium">
                        {sub.category}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-300">
                      {new Date(sub.next_renewal).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${getStatusBadgeStyle(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditModal(sub)}
                          className="p-1.5 bg-slate-850 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-800 rounded-lg text-slate-400 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteConfirm(sub)}
                          className="p-1.5 bg-slate-850 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 rounded-lg text-slate-400 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl p-8 bg-slate-900/10">
          <p className="text-slate-400 text-sm font-medium mb-1">No matching subscriptions found</p>
          <p className="text-slate-500 text-xs text-center max-w-[280px]">
            Try resetting your search query or add a new recurring subscription.
          </p>
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {editingSub ? 'Edit Subscription' : 'New Subscription'}
            </h3>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Subscription Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Netflix, AWS, Spotify"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                />
              </div>

              {/* Cost & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Cost *</label>
                  <input
                    type="number"
                    name="cost"
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="299.00"
                    value={formData.cost}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Billing Cycle & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Billing Cycle</label>
                  <select
                    name="billing_cycle"
                    value={formData.billing_cycle}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Date & Next Renewal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    required
                    value={formData.start_date}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Next Renewal *</label>
                  <input
                    type="date"
                    name="next_renewal"
                    required
                    value={formData.next_renewal}
                    onChange={handleFormChange}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Last Used Date */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Last Used Date (Optional)</label>
                <input
                  type="date"
                  name="last_used_date"
                  value={formData.last_used_date}
                  onChange={handleFormChange}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Used to determine "Unused" status (30+ days idle).</span>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 focus:outline-none"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-350 cursor-pointer">
                  Active subscription (include in aggregations and reminders)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-2">Delete Subscription?</h3>
            <p className="text-slate-400 text-xs mb-6">
              Are you sure you want to delete <span className="font-bold text-white">"{subToDelete?.name}"</span>? This operation cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-850/80 text-slate-350 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/10 active:scale-[0.98] transition-all cursor-pointer"
              >
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
