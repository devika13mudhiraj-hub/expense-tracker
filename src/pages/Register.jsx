import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DollarSign, User, Mail, Lock, TrendingUp, Eye, EyeOff } from 'lucide-react';

export default function Register() {
    const { register } = useApp();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', monthlyIncome: '' });
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name.trim()) return setError('Name is required.');
        if (!form.email.trim()) return setError('Email is required.');
        if (form.password.length < 6) return setError('Password must be at least 6 characters.');
        if (form.password !== form.confirm) return setError('Passwords do not match.');
        if (!form.monthlyIncome || isNaN(parseFloat(form.monthlyIncome))) return setError('Enter a valid monthly income.');

        setLoading(true);
        await new Promise(r => setTimeout(r, 400));
        const result = register(form.name.trim(), form.email.trim(), form.password, form.monthlyIncome);
        setLoading(false);
        if (result.success) navigate('/dashboard');
        else setError(result.error);
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card slide-up">
                <div className="auth-logo">
                    <div className="logo-icon">
                        <DollarSign size={28} color="white" strokeWidth={2.5} />
                    </div>
                    <h1>ExpenseFlow</h1>
                    <p>Create your account to start tracking</p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="reg-name"
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange}
                                style={{ paddingLeft: 42 }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="reg-email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                style={{ paddingLeft: 42 }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Monthly Income (₹)</label>
                        <div style={{ position: 'relative' }}>
                            <TrendingUp size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="reg-income"
                                name="monthlyIncome"
                                type="number"
                                className="form-input"
                                placeholder="50000"
                                value={form.monthlyIncome}
                                onChange={handleChange}
                                style={{ paddingLeft: 42 }}
                                min="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    id="reg-password"
                                    name="password"
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Min 6 chars"
                                    value={form.password}
                                    onChange={handleChange}
                                    style={{ paddingLeft: 42, paddingRight: 40 }}
                                    required
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    id="reg-confirm"
                                    name="confirm"
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Repeat password"
                                    value={form.confirm}
                                    onChange={handleChange}
                                    style={{ paddingLeft: 42 }}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-link-text">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
