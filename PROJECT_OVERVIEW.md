# Project Overview: ExpenseFlow

## 1. Introduction
**ExpenseFlow** is a client-side financial management application designed to empower users with better spending habits through tracking, visualization, and proactive alerts. It prioritizes data privacy by utilizing browser local storage and integrates with cloud services for notifications.

## 2. Requirements

### Functional Requirements
- **User Authentication**: Register and login functionality with local session management.
- **Expense Management**: CRUD operations for expenses with categories (Food, Travel, Bills, etc.) and timestamps.
- **Budgeting System**: Ability to set monthly budget limits per category and track progress in real-time.
- **Reminder System**: Scheduling system for upcoming bills or financial tasks with status tracking.
- **Financial Reporting**: Visualization of spending via charts and generation of downloadable PDF/CSV reports.
- **Automated Notifications**: Trigger-based email alerts for:
    - Exceeding a category budget.
    - Reaching the set monthly income limit.
    - Upcoming bill reminders.
- **Profile Management**: Customizable user profile including monthly income settings for financial analysis.

### Non-Functional Requirements
- **Privacy**: No sensitive financial data is sent to a central server (Local-only storage).
- **Usability**: Responsive design for both desktop and mobile use.
- **Performance**: Near-instant data retrieval and UI updates using React state and LocalStorage.
- **Reliability**: Graceful handling of storage failures and email service timeouts.

## 3. Libraries & Dependencies

| Library | Purpose |
| :--- | :--- |
| **React 19** | Core UI framework. |
| **Vite** | Build system and development server. |
| **Lucide React** | Icon system. |
| **Chart.js / React-Chartjs-2** | Data visualization and graphing. |
| **EmailJS (@emailjs/browser)** | Backend-less email delivery service. |
| **jsPDF / jsPDF-AutoTable** | PDF generation and table formatting. |
| **html2canvas** | Capturing UI elements for export. |
| **React Router Dom** | Application routing and navigation. |

## 4. Databases & Storage

### Storage Engine: Web LocalStorage
The application uses the browser's `localStorage` API for all data persistence. This ensures that users retain full ownership of their data.

#### Data Schema:
- `et_users`: Array of user objects `{ id, name, email, password, monthlyIncome, createdAt }`.
- `et_current_user`: Currently authenticated user session.
- `et_expenses_[userId]`: User-specific expenses.
- `et_budgets_[userId]`: User-specific budget limits.
- `et_reminders_[userId]`: User-specific reminders and schedules.
- `et_sent_notifications`: Tracking object to prevent duplicate redundant alerts within the same period.

## 5. System Architecture
The application follows a standard React architecture:
- **Context API (`AppContext.jsx`)**: Central hub for data management, authentication logic, and notification triggering.
- **Services (`emailService.js`)**: Encapsulated logic for external API interactions.
- **Pages**: Top-level components representing application routes.
- **Components**: Atomic and molecular UI elements.

## 6. Notification Logic
Notifications are managed via a `checkNotifications` effect within the `AppContext`:
1. **Budget Check**: Compares current spending vs. set limits for each category.
2. **Income Check**: Compares total monthly spending vs. user income.
3. **Reminder Check**: Scans for reminders whose due date is today or in the past.
4. **Deduplication**: Uses a `sentNotifications` store to ensure emails are sent only once per event (e.g., once per budget exceeding per month).
