# Project Brief — Expense Tracker

## Overview
Expense Tracker is a personal finance management web application that helps individuals take control of their daily spending. Users can log expenses, organize them into categories, set monthly budget caps, and understand their spending patterns through visual dashboards.

---

## Target Users
- **Primary**: Individuals aged 20–45 managing personal or household finances
- **Secondary**: Freelancers tracking business vs. personal expenses
- **Use context**: Daily mobile/desktop access to log purchases immediately after they happen

### User Pain Points Being Solved
- "I don't know where my money goes each month"
- "I keep overspending on food/subscriptions without realizing it"
- "I need a simple tool that doesn't require linking bank accounts"

---

## Core Features

### 1. Authentication
- Email + password registration and login
- JWT-based sessions stored in secure `httpOnly` cookies
- Protected routes — unauthenticated users redirected to login

### 2. Expense Management
- Add expense: amount (INR), category, date, optional notes/description
- Edit and delete any expense
- Paginated expense list with sort by date or amount
- Inline editing for quick corrections

### 3. Categories
- Default categories: Food, Transport, Bills, Entertainment, Healthcare, Shopping, Education, Other
- Users can create custom categories with a name and color
- Categories are user-scoped (each user has their own set)

### 4. Monthly Budgets
- Set a monthly spending limit per category (e.g., Food: ₹8,000/month)
- Visual progress bars showing spent vs. budget
- **Overspend alerts**: banner/badge when a category exceeds its budget
- Budgets are per-user and roll over monthly (set once, apply every month)

### 5. Dashboard
- Total spending this month vs. last month
- Pie chart: spending breakdown by category (current month)
- Bar chart: monthly spending trend (last 6 months)
- Budget progress cards for all categories with budgets
- Top 5 recent expenses

### 6. Filter & Search
- Filter expense list by date range (start date / end date)
- Filter by one or more categories
- Filter by amount range (min / max)
- Full-text search on expense notes/descriptions
- All filters combinable; results update in real time

### 7. CSV Export
- Export all expenses (or filtered results) as a `.csv` file
- Columns: Date, Category, Amount (INR), Notes
- Filename: `expenses_YYYY-MM.csv`

### 8. UI Polish
- Responsive design — works on mobile (375px) and desktop (1280px+)
- Dark mode / light mode toggle, persisted in `localStorage`
- Form validation with inline error messages
- Loading skeletons for async data, toast notifications for actions

---

## Tech Stack & Rationale

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | React 18 | Industry standard, hooks-based, large ecosystem |
| State management | Redux Toolkit (RTK) | Predictable global state, RTK Query for caching |
| Build tool | Vite | Fast HMR, native ESM, minimal config |
| Styling | Tailwind CSS | Utility-first, fast iteration, easy dark mode |
| Backend | Node.js + Express.js | Same language as frontend, simple REST APIs |
| Database | SQLite (better-sqlite3) | Zero infrastructure, file-based, fast for single-user reads |
| Auth | JWT | Stateless, portable, no session store needed |
| Testing | Vitest + RTL | Vite-native, fast, compatible with Jest API |

**Why SQLite**: This is a personal-use app. A single user's expense data will never exceed tens of thousands of rows — SQLite handles this trivially. No database server to manage, no connection strings, no cloud dependency.

---

## Success Criteria
- [ ] A new user can register, log in, and add their first expense within 2 minutes
- [ ] Dashboard loads and renders charts in under 1 second on localhost
- [ ] Budget overspend alert appears immediately when an expense pushes a category over its limit
- [ ] CSV export downloads correctly with all visible filters applied
- [ ] Application is fully usable on a 375px mobile screen
- [ ] All API endpoints return appropriate error codes and messages
- [ ] Dark mode toggle works without page flicker on load
- [ ] Backend test coverage > 80% for controllers and services

---

## Out of Scope (v1)
- Multi-currency support (INR only)
- Bank account linking or automatic transaction import
- Recurring expense automation
- Shared/family accounts
- Mobile native app (web only)
- Cloud sync (local SQLite file only)
