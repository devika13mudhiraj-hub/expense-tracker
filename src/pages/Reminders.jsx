import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Bell, Trash2, Pencil, X, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

const REMINDER_TYPES = ['Bill Payment', 'Subscription', 'Saving Goal', 'Tax', 'Insurance', 'Loan EMI', 'Other'];
const TYPE_EMOJI = {
    'Bill Payment': '💡', 'Subscription': '📱', 'Saving Goal': '🎯', 'Tax': '📋',
    'Insurance': '🛡️', 'Loan EMI': '🏦', 'Other': '🔔'
};

const emptyForm = { title: '', type: 'Bill Payment', dueDate: '', notes: '' };

export default function Reminders() {
    const { reminders, addReminder, updateReminder, deleteReminder } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [success, setSuccess] = useState('');
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const openAdd = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setForm({ ...emptyForm, dueDate: tomorrow.toISOString().split('T')[0] });
        setEditId(null);
        setShowModal(true);
    };

    const openEdit = (r) => {
        setForm({ title: r.title, type: r.type, dueDate: r.dueDate, notes: r.notes || '' });
        setEditId(r.id);
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.dueDate) return;
        if (editId) {
            updateReminder(editId, form);
            setSuccess('Reminder updated!');
        } else {
            addReminder(form);
            setSuccess('Reminder added!');
        }
        setShowModal(false);
        setEditId(null);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleDelete = (id) => {
        deleteReminder(id);
        setDeleteConfirm(null);
        setSuccess('Reminder deleted!');
        setTimeout(() => setSuccess(''), 3000);
    };

    const categorized = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const overdue = [], dueToday = [], upcoming = [];
        reminders.forEach(r => {
            const d = new Date(r.dueDate); d.setHours(0, 0, 0, 0);
            if (d < today) overdue.push({ ...r, status: 'overdue' });
            else if (d.getTime() === today.getTime()) dueToday.push({ ...r, status: 'today' });
            else upcoming.push({ ...r, status: 'upcoming' });
        });
        return { overdue, dueToday, upcoming };
    }, [reminders]);

    const alertReminders = [...categorized.overdue, ...categorized.dueToday].filter(r => !dismissedAlerts.has(r.id));

    const ReminderCard = ({ r }) => (
        <div className={`reminder-card ${r.status}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{TYPE_EMOJI[r.type] || '🔔'}</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.type}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(r.id)}><Trash2 size={13} /></button>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(r.dueDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                {r.status === 'overdue' && <span className="badge badge-red"><AlertTriangle size={10} /> Overdue</span>}
                {r.status === 'today' && <span className="badge badge-orange"><Clock size={10} /> Due Today</span>}
                {r.status === 'upcoming' && <span className="badge badge-green">Upcoming</span>}
            </div>
            {r.notes && <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>{r.notes}</div>}
        </div>
    );

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Reminders</h1>
                <p>Stay on top of your financial obligations</p>
            </div>

            {success && (
                <div className="alert-banner success">
                    <CheckCircle size={18} color="var(--accent-green)" />
                    <p>{success}</p>
                </div>
            )}

            {/* Alert banners */}
            {alertReminders.map(r => (
                <div key={r.id} className={`alert-banner ${r.status === 'overdue' ? 'danger' : 'warning'}`}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p>
                        <strong>{r.title}</strong> {r.status === 'overdue' ? 'is overdue!' : 'is due today!'}
                        {' '}(Due: {new Date(r.dueDate).toLocaleDateString('en-IN')})
                    </p>
                    <button className="alert-close-btn" onClick={() => setDismissedAlerts(prev => new Set([...prev, r.id]))}>
                        <X size={16} />
                    </button>
                </div>
            ))}

            <div className="section-row">
                <h2>All Reminders ({reminders.length})</h2>
                <button className="btn btn-primary" onClick={openAdd} id="add-reminder-btn">
                    <Plus size={16} /> Add Reminder
                </button>
            </div>

            {reminders.length > 0 ? (
                <>
                    {categorized.overdue.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-red)', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={16} /> Overdue ({categorized.overdue.length})
                            </h3>
                            <div className="reminder-grid">
                                {categorized.overdue.map(r => <ReminderCard key={r.id} r={r} />)}
                            </div>
                        </div>
                    )}

                    {categorized.dueToday.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-orange)', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Clock size={16} /> Due Today ({categorized.dueToday.length})
                            </h3>
                            <div className="reminder-grid">
                                {categorized.dueToday.map(r => <ReminderCard key={r.id} r={r} />)}
                            </div>
                        </div>
                    )}

                    {categorized.upcoming.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-green)', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Bell size={16} /> Upcoming ({categorized.upcoming.length})
                            </h3>
                            <div className="reminder-grid">
                                {categorized.upcoming.map(r => <ReminderCard key={r.id} r={r} />)}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <Bell size={64} />
                    <h3>No reminders yet</h3>
                    <p>Add reminders for bills, subscriptions, and financial goals</p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>
                        <Plus size={16} /> Add First Reminder
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editId ? 'Edit Reminder' : 'Add Reminder'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Reminder Title *</label>
                                <input name="title" type="text" className="form-input"
                                    placeholder="e.g. Electricity Bill" value={form.title} onChange={handleChange} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                                        {REMINDER_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date *</label>
                                    <input name="dueDate" type="date" className="form-input"
                                        value={form.dueDate} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes (optional)</label>
                                <textarea name="notes" className="form-textarea"
                                    placeholder="Any extra details..." value={form.notes} onChange={handleChange}
                                    style={{ minHeight: 70 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editId ? 'Save Changes' : 'Add Reminder'}
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
                            <h3>Delete Reminder</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}><X size={16} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Delete this reminder permanently?</p>
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
