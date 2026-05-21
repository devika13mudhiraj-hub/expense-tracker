# 💸 ExpenseFlow - Smart Expense Tracker

**ExpenseFlow** is a modern, feature-rich web application designed to help users take control of their personal finances. With a focus on privacy, simplicity, and proactive alerts, ExpenseFlow makes tracking expenses, managing budgets, and planning for the future effortless.

---
**LIVE DEPLOYED**
https://expense-tracker-finance.up.railway.app 
PROJECT IS NOW LIVE!!

## 🚀 Key Features

- **📊 Comprehensive Dashboard**: Get a bird's-eye view of your financial health, including recent transactions and budget status.
- **📝 Effortless Expense Tracking**: Quickly add, edit, and categorize your daily spending.
- **🎯 Smart Budgeting**: Set monthly limits for different categories (Food, Rent, Entertainment, etc.) and receive alerts before you overspend.
- **🔔 Proactive Notifications**:
    - **Budget Alerts**: Automated emails when a category limit is exceeded.
    - **Income Thresholds**: Warnings when total spending nears your monthly income.
    - **Bill Reminders**: Never miss a payment with scheduled due-date notifications.
- **📈 Detailed Analytics**: Interactive charts and monthly summaries to visualize spending patterns.
- **📄 Exportable Reports**: Generate professional PDF and CSV reports for your personal records or accounting.
- **🔒 Private & Secure**: User data is securely stored in a local storage database ensuring reliability and scalability.---

## 🛠️ Tech Stack

### Frontend
- **React 19**: Modern UI library for a responsive and dynamic user experience.
- **Vite**: Ultra-fast build tool and development server.
- **Lucide React**: Clean and consistent iconography.
- **Chart.js**: Powerful data visualization for financial insights.
- **React Router Dom**: Seamless client-side navigation.

### Utilities & Services
- **EmailJS**: Integration for sending automated email notifications without a backend.
- **jsPDF & html2canvas**: Client-side PDF generation for reports.
- **Local storage**: Database used for storing user data, expenses, income, and budgets securely.---

## 📂 Project Structure

```text
src/
├── components/     # Reusable UI components (Sidebar, Layouts, etc.)
├── context/        # AppContext for global state management (Auth, Data)
├── pages/          # Individual page components (Dashboard, Expenses, Reports)
├── services/       # External service integrations (EmailJS)
├── assets/         # Static assets and global styles
└── App.jsx         # Root component and routing configuration
```

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure EmailJS (Optional)**:
   To enable real email notifications, update `src/services/emailService.js` with your EmailJS credentials:
   ```javascript
   const EMAILJS_CONFIG = {
     SERVICE_ID: 'your_service_id',
     TEMPLATE_ID: 'your_template_id',
     PUBLIC_KEY: 'your_public_key',
   };
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Made with ❤️ for better financial health.*
