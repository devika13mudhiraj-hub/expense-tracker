import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Download, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Utilities', 'Travel', 'Other'];
const CAT_EMOJI = { Food: '🍔', Transport: '🚗', Housing: '🏠', Entertainment: '🎬', Health: '💊', Shopping: '🛍️', Education: '📚', Utilities: '⚡', Travel: '✈️', Other: '📦' };
const fmt = n => '\u20B9' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtShort = n => '\u20B9' + parseFloat(n || 0).toLocaleString('en-IN');
// PDF-safe: jsPDF Helvetica does not support ₹ or emoji
const fmtPDF = n => 'Rs. ' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function MonthlySummary() {
    const { currentUser, expenses } = useApp();
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

    const income = parseFloat(currentUser?.monthlyIncome || 0);

    const monthlyExpenses = useMemo(() => {
        return expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });
    }, [expenses, selectedMonth, selectedYear]);

    const totalSpent = monthlyExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const savings = income - totalSpent;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

    const categoryBreakdown = useMemo(() => {
        return CATEGORIES.map(cat => {
            const catExp = monthlyExpenses.filter(e => e.category === cat);
            const total = catExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
            return { category: cat, total, count: catExp.length, pct: totalSpent > 0 ? (total / totalSpent * 100).toFixed(1) : 0 };
        }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
    }, [monthlyExpenses, totalSpent]);

    const prevMonth = () => {
        if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
        else setSelectedMonth(m => m - 1);
    };

    const nextMonth = () => {
        const isFuture = (selectedYear === now.getFullYear() && selectedMonth >= now.getMonth()) || selectedYear > now.getFullYear();
        if (isFuture) return;
        if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
        else setSelectedMonth(m => m + 1);
    };

    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    const isFutureMonth = (selectedYear === now.getFullYear() && selectedMonth > now.getMonth()) || selectedYear > now.getFullYear();

    const exportMonthlyPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const periodLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;

        // Header
        doc.setFillColor(139, 92, 246);
        doc.rect(0, 0, pageW, 48, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20); doc.setFont('helvetica', 'bold');
        doc.text(`Monthly Summary — ${periodLabel}`, 20, 20);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(currentUser?.name + ' | ' + currentUser?.email, 20, 30);
        doc.text('Generated: ' + new Date().toLocaleDateString('en-US'), 20, 38);

        // Summary boxes
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Monthly Summary', 20, 60);

        const summaryData = [
            ['Monthly Income', fmtPDF(income), 'Budget for this month'],
            ['Total Expenses', fmtPDF(totalSpent), monthlyExpenses.length + ' transaction(s)'],
            ['Net Savings', fmtPDF(Math.abs(savings)), savings >= 0 ? 'Surplus' : 'Deficit'],
            ['Savings Rate', Math.max(0, savingsRate) + '%', savings >= 0 ? 'Of income saved' : 'Over budget'],
        ];

        autoTable(doc, {
            startY: 65,
            body: summaryData,
            styles: { font: 'helvetica', fontSize: 11, cellPadding: 5 },
            columnStyles: {
                0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 55 },
                1: { fontStyle: 'bold', textColor: [139, 92, 246], fontSize: 13, cellWidth: 55 },
                2: { textColor: [130, 130, 130], fontSize: 9 },
            },
        });

        const afterSummary = doc.lastAutoTable?.finalY || 110;

        // Category breakdown
        if (categoryBreakdown.length > 0) {
            doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
            doc.text('Spending by Category', 20, afterSummary + 12);

            autoTable(doc, {
                startY: afterSummary + 16,
                head: [['#', 'Category', 'Transactions', 'Amount (Rs.)', 'Share (%)']],
                body: categoryBreakdown.map((c, i) => [
                    i + 1,
                    c.category,
                    c.count,
                    fmtPDF(c.total),
                    c.pct + '%'
                ]),
                styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
                headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 245, 255] },
            });
        }

        const afterCat = doc.lastAutoTable?.finalY || 180;

        // All transactions
        if (monthlyExpenses.length > 0) {
            doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
            doc.text('All Transactions', 20, afterCat + 12);

            autoTable(doc, {
                startY: afterCat + 16,
                head: [['Date', 'Description', 'Category', 'Amount (Rs.)']],
                body: [...monthlyExpenses].sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => [
                    new Date(e.date).toLocaleDateString('en-US'),
                    e.description,
                    e.category,
                    fmtPDF(e.amount)
                ]),
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 255, 248] },
                foot: [['', 'TOTAL', '', fmtPDF(totalSpent)]],
                footStyles: { fillColor: [240, 240, 255], fontStyle: 'bold', textColor: [80, 80, 80] },
            });
        }

        // Footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160);
            doc.text(`ExpenseFlow | Monthly Summary – ${periodLabel} | Page ${i} of ${totalPages}`, pageW / 2, 290, { align: 'center' });
        }

        doc.save(`ExpenseFlow_Summary_${periodLabel.replace(' ', '_')}.pdf`);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Monthly Summary</h1>
                <p>Detailed financial overview per month</p>
            </div>

            {/* Month Navigator */}
            <div className="chart-card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button className="btn btn-secondary btn-sm" onClick={prevMonth}><ChevronLeft size={16} /></button>
                        <div style={{ textAlign: 'center', minWidth: 180 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.3rem', background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {MONTHS[selectedMonth]} {selectedYear}
                            </div>
                            {isCurrentMonth && <span className="badge badge-purple" style={{ marginTop: 4 }}>Current Month</span>}
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={nextMonth} disabled={isFutureMonth}><ChevronRight size={16} /></button>
                    </div>
                    <button className="btn btn-primary" id="export-monthly-pdf-btn" onClick={exportMonthlyPDF}>
                        <Download size={16} /> Download PDF Report
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card purple">
                    <div className="stat-icon purple"><TrendingUp size={20} /></div>
                    <div className="stat-label">Monthly Income</div>
                    <div className="stat-value">{fmtShort(income)}</div>
                    <div className="stat-sub">Budgeted income</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><TrendingDown size={20} /></div>
                    <div className="stat-label">Total Spent</div>
                    <div className="stat-value">{fmtShort(totalSpent)}</div>
                    <div className="stat-sub">{monthlyExpenses.length} transactions</div>
                </div>
                <div className={`stat-card ${savings >= 0 ? 'green' : 'red'}`}>
                    <div className={`stat-icon ${savings >= 0 ? 'green' : 'red'}`}><PiggyBank size={20} /></div>
                    <div className="stat-label">{savings >= 0 ? 'Saved' : 'Deficit'}</div>
                    <div className="stat-value" style={{ color: savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {fmtShort(Math.abs(savings))}
                    </div>
                    <div className="stat-sub">{savings >= 0 ? 'You\'re on track!' : 'Over your income'}</div>
                </div>
                <div className="stat-card cyan">
                    <div className="stat-icon cyan"><TrendingUp size={20} /></div>
                    <div className="stat-label">Savings Rate</div>
                    <div className="stat-value">{Math.max(0, savingsRate)}%</div>
                    <div className="stat-sub">Of monthly income</div>
                </div>
            </div>

            {/* Savings Health Indicator */}
            <div className="chart-card" style={{ marginBottom: 24 }}>
                <div className="chart-title" style={{ marginBottom: 12 }}>Budget Health</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Spent: {fmt(totalSpent)}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {income > 0 ? Math.min(100, Math.round((totalSpent / income) * 100)) : 0}% of income
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>Limit: {fmt(income)}</span>
                </div>
                <div className="progress-bar-wrap" style={{ height: 14, borderRadius: 10 }}>
                    <div
                        className={`progress-bar ${totalSpent > income ? 'red' : totalSpent > income * 0.8 ? 'orange' : 'green'}`}
                        style={{ width: `${income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0}%` }}
                    />
                </div>
                <div style={{ marginTop: 10, fontSize: '0.85rem', color: savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                    {savings >= 0 ? `✅ Great! You saved ${fmt(savings)} this month.` : `⚠️ You overspent by ${fmt(Math.abs(savings))} this month.`}
                </div>
            </div>

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 ? (
                <div className="chart-card" style={{ marginBottom: 24 }}>
                    <div className="section-row">
                        <div className="chart-title" style={{ margin: 0 }}>Category Breakdown</div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{categoryBreakdown.length} categories</span>
                    </div>
                    <div className="table-wrapper" style={{ marginTop: 16 }}>
                        <table>
                            <thead>
                                <tr><th>#</th><th>Category</th><th>Transactions</th><th>Amount</th><th>Share</th><th>Progress</th></tr>
                            </thead>
                            <tbody>
                                {categoryBreakdown.map((c, i) => (
                                    <tr key={c.category}>
                                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{CAT_EMOJI[c.category]} {c.category}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{c.count}</td>
                                        <td style={{ fontWeight: 700 }}>{fmt(c.total)}</td>
                                        <td><span className="badge badge-purple">{c.pct}%</span></td>
                                        <td style={{ minWidth: 100 }}>
                                            <div className="progress-bar-wrap" style={{ marginTop: 0 }}>
                                                <div className="progress-bar purple" style={{ width: `${c.pct}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: 'rgba(139,92,246,0.07)' }}>
                                    <td colSpan={3} style={{ fontWeight: 700, padding: '12px 16px' }}>TOTAL</td>
                                    <td style={{ fontWeight: 800, color: 'var(--accent-red)', padding: '12px 16px' }}>{fmt(totalSpent)}</td>
                                    <td style={{ padding: '12px 16px' }}><span className="badge badge-purple">100%</span></td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="chart-card">
                    <div className="empty-state">
                        <Calendar size={64} />
                        <h3>No expenses for {MONTHS[selectedMonth]} {selectedYear}</h3>
                        <p>Use the navigation above to browse different months</p>
                    </div>
                </div>
            )}

            {/* All transactions of the month */}
            {monthlyExpenses.length > 0 && (
                <div className="chart-card">
                    <div className="chart-title">All Transactions — {MONTHS[selectedMonth]} {selectedYear}</div>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
                            </thead>
                            <tbody>
                                {[...monthlyExpenses].sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => (
                                    <tr key={e.id}>
                                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                                        <td style={{ fontWeight: 600 }}>{e.description}</td>
                                        <td><span className="badge badge-purple">{CAT_EMOJI[e.category]} {e.category}</span></td>
                                        <td style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{fmt(e.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
