import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend
} from 'chart.js';
import {
    TrendingUp, TrendingDown, Wallet, PiggyBank, Receipt,
    AlertTriangle, Bell, Plus, ArrowRight
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORY_COLORS = {
    Food: '#8b5cf6', Transport: '#06b6d4', Housing: '#10b981',
    Entertainment: '#f59e0b', Health: '#ec4899', Shopping: '#ef4444',
    Education: '#6366f1', Utilities: '#14b8a6', Travel: '#f97316', Other: '#78716c',
};

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function Dashboard() {
    const { currentUser, expenses, budgets, getDueReminders, getExpensesByCategory } = useApp();
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const totalIncome = parseFloat(currentUser?.monthlyIncome || 0);
    const monthlyExpenses = useMemo(() => {
        return expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === month && d.getFullYear() === year;
        });
    }, [expenses, month, year]);

    const totalSpent = monthlyExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const remaining = totalIncome - totalSpent;
    const savingsRate = totalIncome > 0 ? ((remaining / totalIncome) * 100).toFixed(0) : 0;

    const dueReminders = getDueReminders();
    const catData = getExpensesByCategory(month, year);
    const catKeys = Object.keys(catData);

    const chartData = {
        labels: catKeys,
        datasets: [{
            data: catKeys.map(k => catData[k]),
            backgroundColor: catKeys.map(k => CATEGORY_COLORS[k] || '#8b5cf6'),
            borderColor: 'rgba(0,0,0,0.3)',
            borderWidth: 2,
            hoverOffset: 8,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#a0a0c0', padding: 14, font: { size: 12, family: 'Inter' }, boxWidth: 14 }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ₹${ctx.parsed.toLocaleString('en-IN')}`
                }
            }
        },
        cutout: '70%',
    };

    // Budget alerts
    const budgetAlerts = budgets.filter(b => {
        const used = monthlyExpenses
            .filter(e => e.category === b.category)
            .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        return used >= parseFloat(b.amount) * 0.9;
    });

    const recentExpenses = expenses.slice(0, 5);

    const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Welcome back, {currentUser?.name?.split(' ')[0]} 👋</h1>
                <p>Here's your financial overview for {monthName}</p>
            </div>

            {/* Alerts */}
            {dueReminders.length > 0 && (
                <div className="alert-banner warning" style={{ marginBottom: 20 }}>
                    <Bell size={18} color="var(--accent-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p>You have <strong>{dueReminders.length}</strong> overdue reminder{dueReminders.length > 1 ? 's' : ''}. <Link to="/reminders" style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>View now →</Link></p>
                </div>
            )}

            {budgetAlerts.length > 0 && (
                <div className="alert-banner danger" style={{ marginBottom: 20 }}>
                    <AlertTriangle size={18} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p><strong>{budgetAlerts.map(b => b.category).join(', ')}</strong> budget{budgetAlerts.length > 1 ? 's are' : ' is'} almost exhausted! <Link to="/budget" style={{ color: 'var(--accent-red)', fontWeight: 700 }}>Manage budgets →</Link></p>
                </div>
            )}

            {remaining < 0 && (
                <div className="alert-banner danger" style={{ marginBottom: 20 }}>
                    <TrendingDown size={18} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p>You've exceeded your monthly income by <strong>{fmt(Math.abs(remaining))}</strong>! Consider reviewing your expenses.</p>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card purple">
                    <div className="stat-icon purple"><Wallet size={20} /></div>
                    <div className="stat-label">Monthly Income</div>
                    <div className="stat-value">{fmt(totalIncome)}</div>
                    <div className="stat-sub">This month's budget</div>
                </div>

                <div className="stat-card red">
                    <div className="stat-icon red"><TrendingDown size={20} /></div>
                    <div className="stat-label">Total Spent</div>
                    <div className="stat-value">{fmt(totalSpent)}</div>
                    <div className="stat-sub">{monthlyExpenses.length} transactions</div>
                </div>

                <div className={`stat-card ${remaining >= 0 ? 'green' : 'red'}`}>
                    <div className={`stat-icon ${remaining >= 0 ? 'green' : 'red'}`}><TrendingUp size={20} /></div>
                    <div className="stat-label">Remaining</div>
                    <div className="stat-value" style={{ color: remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {fmt(Math.abs(remaining))}
                    </div>
                    <div className="stat-sub">{remaining >= 0 ? 'Available to spend' : 'Over budget'}</div>
                </div>

                <div className="stat-card cyan">
                    <div className="stat-icon cyan"><PiggyBank size={20} /></div>
                    <div className="stat-label">Savings Rate</div>
                    <div className="stat-value">{Math.max(0, savingsRate)}%</div>
                    <div className="stat-sub">Of monthly income</div>
                </div>
            </div>

            {/* Charts + Recent */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-title">Spending by Category</div>
                    {catKeys.length > 0 ? (
                        <div style={{ height: 260, position: 'relative' }}>
                            <Doughnut data={chartData} options={chartOptions} />
                            <div style={{
                                position: 'absolute', top: '50%', left: '35%', transform: 'translate(-50%, -50%)',
                                textAlign: 'center', pointerEvents: 'none'
                            }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(totalSpent)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Spent</div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Receipt size={48} />
                            <h3>No expenses yet</h3>
                            <p>Add your first expense to see the chart</p>
                        </div>
                    )}
                </div>

                <div className="chart-card">
                    <div className="section-row">
                        <div className="chart-title" style={{ margin: 0 }}>Recent Transactions</div>
                        <Link to="/expenses" className="btn btn-secondary btn-sm">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {recentExpenses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                            {recentExpenses.map(exp => (
                                <div key={exp.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div className="cat-icon" style={{ background: `${CATEGORY_COLORS[exp.category] || '#8b5cf6'}20` }}>
                                        <span>{getCatEmoji(exp.category)}</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {exp.description}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {exp.category} · {new Date(exp.date).toLocaleDateString('en-IN')}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--accent-red)', flexShrink: 0 }}>
                                        -{fmt(exp.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Receipt size={48} />
                            <h3>No transactions</h3>
                            <Link to="/expenses" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                                <Plus size={14} /> Add First Expense
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Budget Overview */}
            {budgets.length > 0 && (
                <div className="chart-card">
                    <div className="section-row">
                        <div className="chart-title" style={{ margin: 0 }}>Budget Overview</div>
                        <Link to="/budget" className="btn btn-secondary btn-sm">Manage <ArrowRight size={14} /></Link>
                    </div>
                    <div className="budget-grid" style={{ marginTop: 16 }}>
                        {budgets.map(b => {
                            const spent = monthlyExpenses
                                .filter(e => e.category === b.category)
                                .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                            const pct = Math.min(100, Math.round((spent / parseFloat(b.amount)) * 100));
                            const color = pct >= 100 ? 'red' : pct >= 80 ? 'orange' : 'green';
                            return (
                                <div key={b.id} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {getCatEmoji(b.category)} {b.category}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: `var(--accent-${color})` }}>
                                            {fmt(spent)} / {fmt(b.amount)}
                                        </span>
                                    </div>
                                    <div className="progress-bar-wrap">
                                        <div className={`progress-bar ${color}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function getCatEmoji(cat) {
    const map = {
        Food: '🍔', Transport: '🚗', Housing: '🏠', Entertainment: '🎬',
        Health: '💊', Shopping: '🛍️', Education: '📚', Utilities: '⚡',
        Travel: '✈️', Other: '📦'
    };
    return map[cat] || '💰';
}
