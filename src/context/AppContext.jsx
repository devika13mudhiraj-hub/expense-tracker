import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { emailService } from '../services/emailService';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  USERS: 'et_users',
  CURRENT_USER: 'et_current_user',
  EXPENSES: 'et_expenses',
  BUDGETS: 'et_budgets',
  REMINDERS: 'et_reminders',
  SENT_NOTIFICATIONS: 'et_sent_notifications',
};

const getStore = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};

const setStore = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e) { console.error('Storage error', e); }
};

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)); }
    catch { return null; }
  });

  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const lastCheckRef = useRef(0);
  const [sentNotifications, setSentNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SENT_NOTIFICATIONS)) || {}; }
    catch { return {}; }
  });

  // Load user data when user changes
  useEffect(() => {
    if (currentUser) {
      setExpenses(getStore(`${STORAGE_KEYS.EXPENSES}_${currentUser.id}`) || []);
      setBudgets(getStore(`${STORAGE_KEYS.BUDGETS}_${currentUser.id}`) || []);
      setReminders(getStore(`${STORAGE_KEYS.REMINDERS}_${currentUser.id}`) || []);
    } else {
      setExpenses([]);
      setBudgets([]);
      setReminders([]);
    }
  }, [currentUser?.id]);

  const saveExpenses = useCallback((data) => {
    setExpenses(data);
    if (currentUser) setStore(`${STORAGE_KEYS.EXPENSES}_${currentUser.id}`, data);
  }, [currentUser]);

  const saveBudgets = useCallback((data) => {
    setBudgets(data);
    if (currentUser) setStore(`${STORAGE_KEYS.BUDGETS}_${currentUser.id}`, data);
  }, [currentUser]);

  const saveReminders = useCallback((data) => {
    setReminders(data);
    if (currentUser) setStore(`${STORAGE_KEYS.REMINDERS}_${currentUser.id}`, data);
  }, [currentUser]);

  // AUTH
  const register = (name, email, password, monthlyIncome) => {
    const users = getStore(STORAGE_KEYS.USERS);
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered.' };
    }
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setStore(STORAGE_KEYS.USERS, users);
    const { password: _, ...safeUser } = newUser;
    setCurrentUser(safeUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    return { success: true };
  };

  const login = (email, password) => {
    const users = getStore(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, error: 'Invalid email or password.' };
    const { password: _, ...safeUser } = user;
    setCurrentUser(safeUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const updateProfile = (updates) => {
    const users = getStore(STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) return { success: false, error: 'User not found.' };

    if (updates.newPassword) {
      if (updates.currentPassword !== users[idx].password) {
        return { success: false, error: 'Current password is incorrect.' };
      }
      users[idx].password = updates.newPassword;
    }

    if (updates.name) users[idx].name = updates.name;
    if (updates.email) users[idx].email = updates.email;
    if (updates.monthlyIncome !== undefined) users[idx].monthlyIncome = parseFloat(updates.monthlyIncome) || 0;

    setStore(STORAGE_KEYS.USERS, users);
    const { password: _, ...safeUser } = users[idx];
    setCurrentUser(safeUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    return { success: true };
  };

  // EXPENSES CRUD
  const addExpense = (expense) => {
    const newExpense = { ...expense, id: `exp_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [newExpense, ...expenses];
    saveExpenses(updated);
    return newExpense;
  };

  const updateExpense = (id, data) => {
    const updated = expenses.map(e => e.id === id ? { ...e, ...data } : e);
    saveExpenses(updated);
  };

  const deleteExpense = (id) => {
    saveExpenses(expenses.filter(e => e.id !== id));
  };

  // BUDGETS CRUD
  const addBudget = (budget) => {
    const newBudget = { ...budget, id: `bud_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [...budgets, newBudget];
    saveBudgets(updated);
    return newBudget;
  };

  const updateBudget = (id, data) => {
    saveBudgets(budgets.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteBudget = (id) => {
    saveBudgets(budgets.filter(b => b.id !== id));
  };

  // REMINDERS CRUD
  const addReminder = (reminder) => {
    const newReminder = { ...reminder, id: `rem_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [...reminders, newReminder];
    saveReminders(updated);
    return newReminder;
  };

  const updateReminder = (id, data) => {
    saveReminders(reminders.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const deleteReminder = (id) => {
    saveReminders(reminders.filter(r => r.id !== id));
  };

  // COMPUTED
  const getTotalExpenses = (month, year) => {
    let filtered = expenses;
    if (month !== undefined && year !== undefined) {
      filtered = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    }
    return filtered.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  };

  const getExpensesByCategory = (month, year) => {
    let filtered = expenses;
    if (month !== undefined && year !== undefined) {
      filtered = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    }
    return filtered.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
      return acc;
    }, {});
  };

  const getBudgetUsage = (budgetItem) => {
    const now = new Date();
    const catExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return e.category === budgetItem.category &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    });
    return catExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  };

  const getDueReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reminders.filter(r => {
      const d = new Date(r.dueDate);
      d.setHours(0, 0, 0, 0);
      return d <= today;
    });
  };

  // NOTIFICATION TRIGGER LOGIC
  const checkNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    // Throttle checks to once every 5 seconds
    if (Date.now() - lastCheckRef.current < 5000) return;
    lastCheckRef.current = Date.now();
    
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const todayKey = now.toISOString().split('T')[0];
    const newSent = { ...sentNotifications };
    let changed = false;

    // 1. Check Budget Exceed
    for (const b of budgets) {
      const used = getBudgetUsage(b);
      const limit = parseFloat(b.amount);
      const notificationId = `budget_${b.id}_${monthKey}`;

      if (used > limit) {
        if (!newSent[notificationId]) {
          console.log(`🚀 TRIGGERING Budget Notification: ${b.category} (Spent: ₹${used}, Limit: ₹${limit})`);
          try {
            await emailService.notifyBudgetExceeded(currentUser.email, currentUser.name, b.category, limit, used);
            newSent[notificationId] = { date: new Date().toISOString(), type: 'budget' };
            changed = true;
          } catch (e) { console.error('Budget notification failed', e); }
        }
      }
    }

    // 2. Check Income Reached
    const totalSpentThisMonth = getTotalExpenses(now.getMonth(), now.getFullYear());
    const monthlyIncome = parseFloat(currentUser.monthlyIncome || 0);
    const incomeNotificationId = `income_${currentUser.id}_${monthKey}`;

    if (monthlyIncome > 0 && totalSpentThisMonth >= monthlyIncome && !newSent[incomeNotificationId]) {
      console.log('Triggering Income Notification');
      try {
        // Assuming emailService is imported statically at the top of the file
        await emailService.notifyIncomeReached(currentUser.email, currentUser.name, monthlyIncome, totalSpentThisMonth);
        newSent[incomeNotificationId] = { date: new Date().toISOString(), type: 'income' };
        changed = true;
      } catch (e) { console.error('Income notification failed', e); }
    }

    // 3. Check Reminders Due
    const dueReminders = getDueReminders();
    for (const r of dueReminders) {
      const reminderNotificationId = `reminder_${r.id}_${todayKey}`;
      if (!newSent[reminderNotificationId]) {
        console.log(`🚀 TRIGGERING Reminder Notification: ${r.title}`);
        try {
          await emailService.notifyReminderDue(currentUser.email, currentUser.name, r.title, r.dueDate);
          newSent[reminderNotificationId] = { date: new Date().toISOString(), type: 'reminder' };
          changed = true;
        } catch (e) { console.error('Reminder notification failed', e); }
      }
    }

    if (changed) {
      setSentNotifications(newSent);
      localStorage.setItem(STORAGE_KEYS.SENT_NOTIFICATIONS, JSON.stringify(newSent));
    }
  }, [currentUser, budgets, expenses, sentNotifications, getBudgetUsage, getTotalExpenses, getDueReminders]); // Added getDueReminders to dependencies

  // Run check periodically or when data changes
  useEffect(() => {
    const timeoutId = setTimeout(checkNotifications, 2000); 
    return () => clearTimeout(timeoutId);
  }, [expenses, budgets, reminders, currentUser?.id, checkNotifications]);

  const value = {
    currentUser, login, logout, register, updateProfile,
    expenses, addExpense, updateExpense, deleteExpense,
    budgets, addBudget, updateBudget, deleteBudget,
    reminders, addReminder, updateReminder, deleteReminder,
    getTotalExpenses, getExpensesByCategory, getBudgetUsage, getDueReminders,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
