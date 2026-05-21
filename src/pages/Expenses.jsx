import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Pencil, Trash2, Filter, X, CheckCircle } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Utilities', 'Travel', 'Other'];

const CAT_EMOJI = {
    Food: '🍔', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
    Health: '💊', Shopping: '🛍️', Education: '📚', Utilities: '⚡',
    Travel: '✈️', Other: '📦'
};

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');

const emptyForm = { description: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], notes: '' };

export default function Expenses() {
    const { expenses, addExpense, updateExpense, deleteExpense } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [success, setSuccess] = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const openAdd = () => {
        setForm(emptyForm);
        setEditId(null);
        setShowModal(true);
    };

    const openEdit = (exp) => {
        setForm({ description: exp.description, amount: exp.amount, category: exp.category, date: exp.date, notes: exp.notes || '' });
        setEditId(exp.id);
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!form.description.trim() || !form.amount || !form.date) return;
        if (editId) {
            updateExpense(editId, form);
            setSuccess('Expense updated!');
        } else {
            addExpense(form);
            setSuccess('Expense added!');
        }
        setShowModal(false);
        setEditId(null);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleDelete = (id) => {
        deleteExpense(id);
        setDeleteConfirm(null);
        setSuccess('Expense deleted!');
        setTimeout(() => setSuccess(''), 3000);
    };

    const filtered = useMemo(() => {
        return expenses.filter(e => {
            const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
            const matchCat = !catFilter || e.category === catFilter;
            const matchMonth = !monthFilter || e.date.startsWith(monthFilter);
            return matchSearch && matchCat && matchMonth;
        });
    }, [expenses, search, catFilter, monthFilter]);

    const totalFiltered = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Expenses</h1>
                <p>Track and manage all your spending</p>
            </div>

            {success && (
                <div className="alert-banner success">
                    <CheckCircle size={18} color="var(--accent-green)" />
                    <p>{success}</p>
                </div>
            )}

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-input-wrap">
                    <Search size={16} />
                    <input
                        className="form-input"
                        placeholder="Search expenses..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <select className="form-select" style={{ maxWidth: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                </select>

                <input
                    type="month"
                    className="form-input"
                    style={{ maxWidth: 180 }}
                    value={monthFilter}
                    onChange={e => setMonthFilter(e.target.value)}
                />

                {(search || catFilter || monthFilter) && (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setCatFilter(''); setMonthFilter(''); }}>
                        <X size={14} /> Clear
                    </button>
                )}

                <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openAdd} id="add-expense-btn">
                    <Plus size={16} /> Add Expense
                </button>
            </div>

            {/* Summary */}
            {filtered.length > 0 && (
                <div style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> expenses ·
                    Total: <strong style={{ color: 'var(--accent-red)' }}>{fmt(totalFiltered)}</strong>
                </div>
            )}

            {/* Table */}
            <div className="table-wrapper">
                {filtered.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(exp => (
                                <tr key={exp.id}>
                                    <td style={{ fontWeight: 600 }}>{exp.description}</td>
                                    <td>
                                        <span className="badge badge-purple">
                                            {CAT_EMOJI[exp.category]} {exp.category}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(exp.date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{fmt(exp.amount)}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {exp.notes || '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(exp)} title="Edit">
                                                <Pencil size={14} />
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(exp.id)} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <Search size={64} />
                        <h3>{expenses.length === 0 ? 'No expenses yet' : 'No results found'}</h3>
                        <p>{expenses.length === 0 ? 'Add your first expense to start tracking' : 'Try adjusting your search or filters'}</p>
                        {expenses.length === 0 && (
                            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>
                                <Plus size={16} /> Add Expense
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editId ? 'Edit Expense' : 'Add Expense'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <input name="description" type="text" className="form-input"
                                    placeholder="e.g. Grocery shopping"
                                    value={form.description} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input name="amount" type="number" className="form-input"
                                        placeholder="0.00" value={form.amount} onChange={handleChange}
                                        min="0" step="0.01" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input name="date" type="date" className="form-input"
                                        value={form.date} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes (optional)</label>
                                <textarea name="notes" className="form-textarea"
                                    placeholder="Any additional notes..." value={form.notes} onChange={handleChange}
                                    style={{ minHeight: 70 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editId ? 'Save Changes' : 'Add Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirm Delete</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}><X size={16} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Are you sure you want to delete this expense? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
