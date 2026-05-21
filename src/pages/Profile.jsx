import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Mail, TrendingUp, Lock, Save, CheckCircle, Shield } from 'lucide-react';

export default function Profile() {
    const { currentUser, updateProfile, expenses } = useApp();
    const [tab, setTab] = useState('info');
    const [sendingTest, setSendingTest] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [infoForm, setInfoForm] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        monthlyIncome: currentUser?.monthlyIncome || '',
    });

    const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const initials = currentUser?.name
        ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const joinDate = currentUser?.createdAt
        ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';
    const daysSince = currentUser?.createdAt
        ? Math.floor((new Date() - new Date(currentUser.createdAt)) / (1000 * 60 * 60 * 24))
        : 0;

    const handleInfoSave = (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!infoForm.name.trim()) return setError('Name is required.');
        if (!infoForm.email.trim()) return setError('Email is required.');
        if (isNaN(parseFloat(infoForm.monthlyIncome)) || parseFloat(infoForm.monthlyIncome) < 0)
            return setError('Enter a valid income.');
        const result = updateProfile({ name: infoForm.name, email: infoForm.email, monthlyIncome: infoForm.monthlyIncome });
        if (result.success) { setSuccess('Profile updated successfully!'); setTimeout(() => setSuccess(''), 3000); }
        else setError(result.error);
    };

    const handlePassSave = (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!passForm.currentPassword) return setError('Enter your current password.');
        if (passForm.newPassword.length < 6) return setError('New password must be at least 6 characters.');
        if (passForm.newPassword !== passForm.confirmPassword) return setError('New passwords do not match.');
        const result = updateProfile({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
        if (result.success) {
            setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setSuccess('Password changed successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } else setError(result.error);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>My Profile</h1>
                <p>Manage your account settings and preferences</p>
            </div>

            {/* Profile Header */}
            <div className="chart-card" style={{ marginBottom: 24 }}>
                <div className="profile-header">
                    <div className="profile-avatar-large">{initials}</div>
                    <div className="profile-info">
                        <h2>{currentUser?.name}</h2>
                        <p>{currentUser?.email}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Member since {joinDate}</p>
                    </div>
                </div>

                <div className="summary-grid">
                    {[
                        { label: 'Monthly Income', value: '₹' + parseFloat(currentUser?.monthlyIncome || 0).toLocaleString('en-IN'), color: 'green' },
                        { label: 'Total Expenses Logged', value: '₹' + totalExpenses.toLocaleString('en-IN'), color: 'red' },
                        { label: 'Total Transactions', value: expenses.length, color: 'purple' },
                        { label: 'Days Tracked', value: daysSince, color: 'cyan' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: `var(--accent-${s.color})` }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => { setTab('info'); setError(''); setSuccess(''); }}>
                    <User size={14} style={{ display: 'inline', marginRight: 6 }} /> Personal Info
                </button>
                <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => { setTab('password'); setError(''); setSuccess(''); }}>
                    <Shield size={14} style={{ display: 'inline', marginRight: 6 }} /> Change Password
                </button>
                <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => { setTab('notifications'); setError(''); setSuccess(''); }}>
                    <Mail size={14} style={{ display: 'inline', marginRight: 6 }} /> Notifications
                </button>
            </div>

            {success && (
                <div className="alert-banner success" style={{ marginBottom: 20 }}>
                    <CheckCircle size={18} color="var(--accent-green)" />
                    <p>{success}</p>
                </div>
            )}
            {error && <div className="error-msg">{error}</div>}

            {tab === 'info' && (
                <div className="chart-card">
                    <div className="chart-title">Personal Information</div>
                    <form onSubmit={handleInfoSave} style={{ maxWidth: 500 }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="form-input" style={{ paddingLeft: 42 }}
                                    value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Your full name" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="email" className="form-input" style={{ paddingLeft: 42 }}
                                    value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="your@email.com" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Monthly Income (₹)</label>
                            <div style={{ position: 'relative' }}>
                                <TrendingUp size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="number" className="form-input" style={{ paddingLeft: 42 }}
                                    value={infoForm.monthlyIncome} onChange={e => setInfoForm(f => ({ ...f, monthlyIncome: e.target.value }))}
                                    placeholder="50000" min="0" required />
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                This is used to calculate your savings rate and budget recommendations.
                            </p>
                        </div>
                        <button type="submit" className="btn btn-primary">
                            <Save size={16} /> Save Changes
                        </button>
                    </form>
                </div>
            )}

            {tab === 'password' && (
                <div className="chart-card">
                    <div className="chart-title">Change Password</div>
                    <form onSubmit={handlePassSave} style={{ maxWidth: 500 }}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="password" className="form-input" style={{ paddingLeft: 42 }}
                                    value={passForm.currentPassword} onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                                    placeholder="Enter current password" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="password" className="form-input" style={{ paddingLeft: 42 }}
                                    value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                                    placeholder="Min 6 characters" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="password" className="form-input" style={{ paddingLeft: 42 }}
                                    value={passForm.confirmPassword} onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                    placeholder="Repeat new password" required />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">
                            <Shield size={16} /> Update Password
                        </button>
                    </form>
                </div>
            )}

            {tab === 'notifications' && (
                <div className="chart-card">
                    <div className="chart-title">Notification Settings</div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                        Manage how you receive updates about your budget, income, and reminders.
                    </p>

                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Email Notifications
                            <span className="badge badge-green">Enabled by Default</span>
                        </label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Notifications are sent to your registered email: <strong>{currentUser?.email}</strong>
                        </p>
                    </div>

                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)', marginTop: 20 }}>
                        <h4 style={{ marginBottom: 10 }}>Test Notifications</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 15 }}>
                            Verify your email setup by sending a test notification.
                            Note: You must configure your Public Key in <code>src/services/emailService.js</code> first.
                        </p>
                        <button
                            className="btn btn-secondary"
                            disabled={sendingTest}
                            onClick={async () => {
                                setSendingTest(true);
                                setError(''); setSuccess('');
                                try {
                                    const { emailService } = await import('../services/emailService');
                                    await emailService.notifyBudgetExceeded(currentUser.email, currentUser.name, 'Test Category', 1000, 1500);
                                    setSuccess('Test notification sent! Check your console/email.');
                                } catch (e) {
                                    setError('Failed to send test notification. Check console for details.');
                                } finally {
                                    setSendingTest(false);
                                }
                            }}
                        >
                            {sendingTest ? 'Sending...' : 'Send Test Notification'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
