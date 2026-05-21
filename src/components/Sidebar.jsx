import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
    LayoutDashboard, Receipt, PiggyBank, User, Bell, BarChart3,
    Calendar, LogOut, TrendingUp, Menu, X, DollarSign
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/budget', icon: PiggyBank, label: 'Budget' },
    { to: '/reminders', icon: Bell, label: 'Reminders' },
    { to: '/reports', icon: BarChart3, label: 'Reports & Charts' },
    { to: '/monthly-summary', icon: Calendar, label: 'Monthly Summary' },
    { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
    const { currentUser, logout, getDueReminders } = useApp();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const dueCount = getDueReminders().length;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => setOpen(!open);
    const closeSidebar = () => setOpen(false);

    const initials = currentUser?.name
        ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <>
            <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle menu">
                {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={closeSidebar} />

            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-wrap">
                        <div className="logo-icon">
                            <DollarSign size={20} color="white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2>ExpenseFlow</h2>
                            <span>Smart Expense Tracker</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Navigation</div>
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <Icon size={18} />
                            {label}
                            {label === 'Reminders' && dueCount > 0 && (
                                <span className="badge">{dueCount}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-info-text">
                            <p>{currentUser?.name || 'User'}</p>
                            <p>{currentUser?.email || ''}</p>
                        </div>
                    </div>
                    <button className="nav-link btn-full" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
