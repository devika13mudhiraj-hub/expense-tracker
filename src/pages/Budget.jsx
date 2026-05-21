import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, Trash2, X, CheckCircle, AlertTriangle, PiggyBank } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Utilities', 'Travel', 'Other'];
const CAT_EMOJI = {
    Food: '🍔', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
    Health: '💊', Shopping: '🛍️', Education: '📚', Utilities: '⚡',
    Travel: '✈️', Other: '📦'
};

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');
const emptyForm = { category: 'Food', amount: '', period: 'monthly' };

export default function Budget() {
    const { budgets, addBudget, updateBudget, deleteBudget, getBudgetUsage } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const openAdd = () => {
        const usedCategories = budgets.map(b => b.category);
        const available = CATEGORIES.filter(c => !usedCategories.includes(c));
        setForm({ ...emptyForm, category: available[0] || CATEGORIES[0] });
        setEditId(null);
        setError('');
        setShowModal(true);
    };

    const openEdit = (b) => {
        setForm({ category: b.category, amount: b.amount, period: b.period || 'monthly' });
        setEditId(b.id);
        setError('');
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid budget amount.');
        if (!editId) {
            const exists = budgets.find(b => b.category === form.category);
            if (exists) return setError(`Budget for ${form.category} already exists.`);
            addBudget(form);
            setSuccess('Budget added!');
        } else {
            updateBudget(editId, form);
            setSuccess('Budget updated!');
        }
        setShowModal(false);
        setEditId(null);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleDelete = (id) => {
        deleteBudget(id);
        setDeleteConfirm(null);
        setSuccess('Budget deleted!');
        setTimeout(() => setSuccess(''), 3000);
    };

    const budgetsWithUsage = useMemo(() => {
        return budgets.map(b => {
            const used = getBudgetUsage(b);
            const limit = parseFloat(b.amount);
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            const status = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok';
            return { ...b, used, pct, status };
        });
    }, [budgets, getBudgetUsage]);

    const usedCategories = budgets.filter(b => !editId || b.id !== editId).map(b => b.category);
    const availableCategories = editId
        ? CATEGORIES
        : CATEGORIES.filter(c => !usedCategories.includes(c));

    const totalBudgeted = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
    const totalUsed = budgetsWithUsage.reduce((s, b) => s + b.used, 0);

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Budget Manager</h1>
                <p>Set and control your spending limits per category</p>
            </div>

            {success && (
                <div className="alert-banner success">
                    <CheckCircle size={18} color="var(--accent-green)" />
                    <p>{success}</p>
                </div>
            )}

            {/* Summary Row */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><PiggyBank size={20} /></div>
                    <div className="stat-label">Total Budgeted</div>
                    <div className="stat-value">{fmt(totalBudgeted)}</div>
                    <div className="stat-sub">{budgets.length} categories</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><AlertTriangle size={20} /></div>
                    <div className="stat-label">Total Used</div>
                    <div className="stat-value">{fmt(totalUsed)}</div>
                    <div className="stat-sub">This month</div>
                </div>
                <div className={`stat-card ${totalBudgeted - totalUsed >= 0 ? 'green' : 'red'}`}>
                    <div className={`stat-icon ${totalBudgeted - totalUsed >= 0 ? 'green' : 'red'}`}><PiggyBank size={20} /></div>
                    <div className="stat-label">Budget Remaining</div>
                    <div className="stat-value">{fmt(Math.abs(totalBudgeted - totalUsed))}</div>
                    <div className="stat-sub">{totalBudgeted - totalUsed >= 0 ? 'Available' : 'Exceeded'}</div>
                </div>
            </div>

            <div className="section-row">
                <h2>Budget Categories</h2>
                <button className="btn btn-primary" onClick={openAdd} id="add-budget-btn"
                    disabled={budgets.length >= CATEGORIES.length}>
                    <Plus size={16} /> Add Budget
                </button>
            </div>

            {budgetsWithUsage.length > 0 ? (
                <div className="budget-grid">
                    {budgetsWithUsage.map(b => {
                        const barColor = b.status === 'over' ? 'red' : b.status === 'warning' ? 'orange' : 'green';
                        const badgeClass = b.status === 'over' ? 'badge-red' : b.status === 'warning' ? 'badge-orange' : 'badge-green';
                        const badgeLabel = b.status === 'over' ? 'Over Budget' : b.status === 'warning' ? 'Warning' : 'On Track';
                        return (
                            <div key={b.id} className="budget-card">
                                <div className="budget-card-header">
                                    <div className="budget-category">
                                        <span style={{ fontSize: 22 }}>{CAT_EMOJI[b.category]}</span>
                                        {b.category}
                                    </div>
                                    <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                                </div>

                                <div style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{b.period}</span>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: `var(--accent-${barColor})` }}>
                                            {b.pct}%
                                        </span>
                                    </div>
                                    <div className="progress-bar-wrap">
                                        <div className={`progress-bar ${barColor}`} style={{ width: `${b.pct}%` }} />
                                    </div>
                                </div>

                                <div className="budget-amounts">
                                    <span>Spent: <strong style={{ color: 'var(--text-primary)' }}>{fmt(b.used)}</strong></span>
                                    <span>Limit: <strong style={{ color: 'var(--text-primary)' }}>{fmt(b.amount)}</strong></span>
                                </div>

                                {b.status === 'over' && (
                                    <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <AlertTriangle size={14} />
                                        Exceeded by {fmt(b.used - parseFloat(b.amount))}
                                    </div>
                                )}

                                <div className="budget-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>
                                        <Pencil size={14} /> Edit
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(b.id)}>
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <PiggyBank size={64} />
                    <h3>No budgets set</h3>
                    <p>Create budgets to control your spending per category</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>
                        <Plus size={16} /> Add Your First Budget
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editId ? 'Edit Budget' : 'Add Budget'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        {error && <div className="error-msg">{error}</div>}
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select name="category" className="form-select" value={form.category} onChange={handleChange} disabled={!!editId}>
                                    {(editId ? CATEGORIES : availableCategories).map(c =>
                                        <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>
                                    )}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Budget Limit (₹) *</label>
                                    <input name="amount" type="number" className="form-input"
                                        placeholder="5000" value={form.amount} onChange={handleChange} min="1" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Period</label>
                                    <select name="period" className="form-select" value={form.period} onChange={handleChange}>
                                        <option value="monthly">Monthly</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editId ? 'Save Changes' : 'Set Budget'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Budget</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}><X size={16} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Are you sure you want to delete this budget? This won't affect your expenses.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>
                                <Trash2 size={16} /> Delete Budget
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
