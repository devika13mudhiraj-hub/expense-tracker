import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Download, BarChart3, TrendingUp, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement,
    PointElement, LineElement, Title, Filler);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Utilities', 'Travel', 'Other'];
const CAT_EMOJI = { Food: '🍔', Transport: '🚗', Housing: '🏠', Entertainment: '🎬', Health: '💊', Shopping: '🛍️', Education: '📚', Utilities: '⚡', Travel: '✈️', Other: '📦' };
const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#78716c'];
const fmt = n => '\u20B9' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
// PDF-safe formatter: jsPDF's built-in Helvetica font does not support ₹ or emoji
const fmtPDF = n => 'Rs. ' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const chartDefaults = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#a0a0c0', font: { family: 'Inter', size: 12 }, boxWidth: 14 } },
        tooltip: { callbacks: { label: ctx => ` ₹${ctx.parsed?.y?.toLocaleString('en-IN') || ctx.parsed?.toLocaleString('en-IN')}` } }
    },
    scales: { x: { ticks: { color: '#6060a0', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#6060a0', font: { family: 'Inter' }, callback: v => '₹' + v.toLocaleString('en-IN') }, grid: { color: 'rgba(255,255,255,0.05)' } } }
};

export default function Reports() {
    const { currentUser, expenses, budgets } = useApp();
    const [activeTab, setActiveTab] = useState('overview');
    const chartsRef = useRef(null);

    const now = new Date();

    // Last 6 months trend
    const trendData = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthExp = expenses.filter(e => {
                const ed = new Date(e.date);
                return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
            });
            months.push({
                label: MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2),
                total: monthExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
            });
        }
        return months;
    }, [expenses]);

    const lineData = {
        labels: trendData.map(m => m.label),
        datasets: [{
            label: 'Monthly Spending',
            data: trendData.map(m => m.total),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139,92,246,0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#8b5cf6',
            pointRadius: 5,
        }]
    };

    // This month category breakdown
    const catData = useMemo(() => {
        const month = now.getMonth(), year = now.getFullYear();
        return CATEGORIES.reduce((acc, cat) => {
            const total = expenses.filter(e => {
                const d = new Date(e.date);
                return e.category === cat && d.getMonth() === month && d.getFullYear() === year;
            }).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
            if (total > 0) acc[cat] = total;
            return acc;
        }, {});
    }, [expenses]);

    const catKeys = Object.keys(catData);
    const doughnutData = {
        labels: catKeys,
        datasets: [{
            data: catKeys.map(k => catData[k]),
            backgroundColor: catKeys.map((_, i) => COLORS[i % COLORS.length]),
            borderColor: 'rgba(0,0,0,0.3)',
            borderWidth: 2, hoverOffset: 8,
        }]
    };

    // Budget vs Actual bar chart
    const budgetVsActual = useMemo(() => {
        const month = now.getMonth(), year = now.getFullYear();
        return budgets.map(b => {
            const actual = expenses.filter(e => {
                const d = new Date(e.date);
                return e.category === b.category && d.getMonth() === month && d.getFullYear() === year;
            }).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
            return { category: b.category, budget: parseFloat(b.amount), actual };
        });
    }, [budgets, expenses]);

    const barData = {
        labels: budgetVsActual.map(b => b.category),
        datasets: [
            { label: 'Budget', data: budgetVsActual.map(b => b.budget), backgroundColor: 'rgba(139,92,246,0.6)', borderRadius: 6 },
            { label: 'Actual', data: budgetVsActual.map(b => b.actual), backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 6 },
        ]
    };

    // All expenses summary
    const allTotal = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const monthTotal = Object.values(catData).reduce((s, v) => s + v, 0);
    const income = parseFloat(currentUser?.monthlyIncome || 0);

    const exportPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(13, 10, 40);
        doc.rect(0, 0, pageW, 50, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22); doc.setFont('helvetica', 'bold');
        doc.text('ExpenseFlow — Financial Report', 20, 22);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('Generated: ' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 20, 32);
        doc.text(`User: ${currentUser?.name} | ${currentUser?.email}`, 20, 40);

        // Summary box
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Financial Summary', 20, 62);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Monthly Income: ' + fmtPDF(income), 20, 72);
        doc.text("This Month's Expenses: " + fmtPDF(monthTotal), 20, 80);
        doc.text('Net Savings: ' + fmtPDF(income - monthTotal), 20, 88);
        doc.text('Savings Rate: ' + (income > 0 ? ((1 - monthTotal / income) * 100).toFixed(1) : 0) + '%', 20, 96);
        doc.text('All-time Total Expenses: ' + fmtPDF(allTotal), 20, 104);

        // Category breakdown table
        if (catKeys.length > 0) {
            doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
            doc.text('Monthly Category Breakdown', 20, 118);
            autoTable(doc, {
                startY: 122,
                head: [['Category', 'Amount (Rs.)', '% of Spending']],
                body: catKeys.map(k => [
                    k,
                    'Rs. ' + parseFloat(catData[k]).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    monthTotal > 0 ? ((catData[k] / monthTotal) * 100).toFixed(1) + '%' : '0%'
                ]),
                styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
                headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 255] },
            });
        }

        // Budget vs Actual table
        if (budgetVsActual.length > 0) {
            const afterCat = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : 160;
            doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
            doc.text('Budget vs Actual (This Month)', 20, afterCat);
            autoTable(doc, {
                startY: afterCat + 4,
                head: [['Category', 'Budget (Rs.)', 'Actual (Rs.)', 'Difference', 'Status']],
                body: budgetVsActual.map(b => [
                    b.category,
                    'Rs. ' + b.budget.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    'Rs. ' + b.actual.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    'Rs. ' + (b.budget - b.actual).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    b.actual > b.budget ? 'Over Budget' : 'Within Budget',
                ]),
                styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
                headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 255, 255] },
            });
        }

        // Recent expenses
        if (expenses.length > 0) {
            const afterBudget = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : 220;
            const yPos = afterBudget + 10;
            if (yPos < 250) {
                doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
                doc.text('Recent 15 Transactions', 20, yPos);
                autoTable(doc, {
                    startY: yPos + 4,
                    head: [['Date', 'Description', 'Category', 'Amount (Rs.)']],
                    body: expenses.slice(0, 15).map(e => [
                        new Date(e.date).toLocaleDateString('en-US'),
                        e.description,
                        e.category,
                        'Rs. ' + parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                    ]),
                    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
                    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 255, 249] },
                });
            }
        }

        // Footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160);
            doc.text(`ExpenseFlow | Page ${i} of ${totalPages} | ${new Date().toLocaleDateString()}`, pageW / 2, 290, { align: 'center' });
        }

        doc.save(`ExpenseFlow_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportCSV = () => {
        const header = ['Date', 'Description', 'Category', 'Amount (Rs.)', 'Notes'];
        const rows = expenses.map(e => [
            e.date,
            '"' + (e.description || '').replace(/"/g, '""') + '"',
            e.category,
            parseFloat(e.amount || 0).toFixed(2),
            '"' + (e.notes || '').replace(/"/g, '""') + '"'
        ]);
        // UTF-8 BOM ensures Excel opens the file with correct encoding
        const BOM = '\uFEFF';
        const csvContent = BOM + [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ExpenseFlow_Expenses_' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Reports & Charts</h1>
                <p>Visual insights into your spending patterns</p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" id="export-pdf-btn" onClick={exportPDF}>
                    <Download size={16} /> Export PDF Report
                </button>
                <button className="btn btn-secondary" id="export-csv-btn" onClick={exportCSV}>
                    <FileText size={16} /> Export CSV
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                    <BarChart3 size={14} style={{ display: 'inline', marginRight: 6 }} /> Overview
                </button>
                <button className={`tab ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => setActiveTab('trends')}>
                    <TrendingUp size={14} style={{ display: 'inline', marginRight: 6 }} /> Spending Trends
                </button>
                <button className={`tab ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>
                    <BarChart3 size={14} style={{ display: 'inline', marginRight: 6 }} /> Budget vs Actual
                </button>
            </div>

            {expenses.length === 0 ? (
                <div className="empty-state">
                    <BarChart3 size={64} />
                    <h3>No data to display</h3>
                    <p>Add some expenses to see your financial charts</p>
                </div>
            ) : (
                <div ref={chartsRef}>
                    {activeTab === 'overview' && (
                        <>
                            <div className="stats-grid" style={{ marginBottom: 24 }}>
                                <div className="stat-card purple">
                                    <div className="stat-label">Monthly Income</div>
                                    <div className="stat-value">{fmt(income)}</div>
                                </div>
                                <div className="stat-card red">
                                    <div className="stat-label">This Month</div>
                                    <div className="stat-value">{fmt(monthTotal)}</div>
                                </div>
                                <div className={`stat-card ${income - monthTotal >= 0 ? 'green' : 'red'}`}>
                                    <div className="stat-label">Net Savings</div>
                                    <div className="stat-value">{fmt(Math.abs(income - monthTotal))}</div>
                                </div>
                                <div className="stat-card cyan">
                                    <div className="stat-label">All-Time Total</div>
                                    <div className="stat-value">{fmt(allTotal)}</div>
                                </div>
                            </div>

                            <div className="charts-grid">
                                <div className="chart-card">
                                    <div className="chart-title">This Month by Category</div>
                                    {catKeys.length > 0 ? (
                                        <div style={{ height: 300 }}>
                                            <Doughnut data={doughnutData} options={{ ...chartDefaults, scales: undefined }} />
                                        </div>
                                    ) : <div className="empty-state" style={{ padding: 40 }}><p>No expenses this month</p></div>}
                                </div>

                                <div className="chart-card">
                                    <div className="chart-title">Category Breakdown Table</div>
                                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                        {catKeys.length > 0 ? catKeys.sort((a, b) => catData[b] - catData[a]).map((cat, i) => (
                                            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                                <span style={{ flex: 1 }}>{CAT_EMOJI[cat]} {cat}</span>
                                                <span style={{ fontWeight: 700 }}>{fmt(catData[cat])}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', minWidth: 40, textAlign: 'right' }}>
                                                    {monthTotal > 0 ? ((catData[cat] / monthTotal) * 100).toFixed(1) + '%' : '0%'}
                                                </span>
                                            </div>
                                        )) : <div className="empty-state" style={{ padding: 40 }}><p>No data for this period</p></div>}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'trends' && (
                        <div className="chart-card">
                            <div className="chart-title">6-Month Spending Trend</div>
                            <div style={{ height: 350 }}>
                                <Line data={lineData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 16 }}>
                                {trendData.map(m => (
                                    <div key={m.label} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
                                        <div style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{fmt(m.total)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'budget' && (
                        <>
                            {budgetVsActual.length > 0 ? (
                                <>
                                    <div className="chart-card" style={{ marginBottom: 24 }}>
                                        <div className="chart-title">Budget vs Actual Spending</div>
                                        <div style={{ height: 350 }}>
                                            <Bar data={barData} options={chartDefaults} />
                                        </div>
                                    </div>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Remaining</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {budgetVsActual.map(b => {
                                                    const diff = b.budget - b.actual;
                                                    return (
                                                        <tr key={b.category}>
                                                            <td style={{ fontWeight: 600 }}>{CAT_EMOJI[b.category]} {b.category}</td>
                                                            <td>{fmt(b.budget)}</td>
                                                            <td style={{ color: 'var(--accent-red)' }}>{fmt(b.actual)}</td>
                                                            <td style={{ color: diff >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
                                                                {diff >= 0 ? '+' : ''}{fmt(diff)}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${diff >= 0 ? 'badge-green' : 'badge-red'}`}>
                                                                    {diff >= 0 ? '✓ Within Budget' : '⚠ Over Budget'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <BarChart3 size={64} />
                                    <h3>No budgets set</h3>
                                    <p>Create budgets to compare with your actual spending</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
