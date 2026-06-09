# Build Plan — Expense Tracker

Six phased milestones. Each phase is independently deployable and testable before moving to the next.

---

## Phase 1 — Database Schema & Models

**Goal**: Establish the data foundation. All business logic depends on this being correct.

### Tasks

#### 1.1 Write migration scripts
Create SQL migration files in `/server/db/migrations/`:
- `001_create_users.sql` — users table (id, email, password_hash, name, created_at)
- `002_create_categories.sql` — categories table (id, user_id, name, color, is_default)
- `003_create_expenses.sql` — expenses table (id, user_id, category_id, amount_paise, date, notes, created_at, updated_at)
- `004_create_budgets.sql` — budgets table (id, user_id, category_id, amount_paise, month — unique per user+category+month)

**Done means**: Running `node server/db/migrate.js` creates all four tables with correct foreign keys and indexes. No errors on repeated runs (idempotent).

#### 1.2 Implement model layer
Create model files in `/server/models/`:
- `User.js` — findByEmail, create, findById
- `Category.js` — findByUser, create, update, delete, seedDefaults
- `Expense.js` — create, update, delete, findByUser (with filters: dateRange, categoryId, search, pagination)
- `Budget.js` — upsert (create or update), findByUserAndMonth, findByCategory

**Done means**: Each model exported as a plain object of functions using prepared statements. A `models.test.js` test file can call `Expense.create()` and retrieve it back. No raw SQL strings built via concatenation.

#### 1.3 Seed default categories
On server start, if a new user is created, seed their account with 8 default categories: Food, Transport, Bills, Entertainment, Healthcare, Shopping, Education, Other.

**Done means**: After user registration, `SELECT * FROM categories WHERE user_id = ?` returns 8 rows with correct names and default colors.

---

## Phase 2 — Auth System

**Goal**: Secure user registration, login, and route protection.

### Tasks

#### 2.1 Registration and login endpoints
- `POST /api/v1/auth/register` — validate email+password, hash password, create user, seed categories, return JWT cookie
- `POST /api/v1/auth/login` — verify credentials, return JWT cookie
- `POST /api/v1/auth/logout` — clear the cookie
- `GET /api/v1/auth/me` — return current user from token (protected)

**Done means**: Can register a new user via curl/Postman, then log in and receive a valid cookie. Attempting to access `/api/v1/auth/me` without a cookie returns `401 { error: "Unauthorized", code: 401 }`.

#### 2.2 JWT middleware
Create `/server/middleware/auth.js`:
- Reads token from `httpOnly` cookie
- Verifies signature, checks expiry
- Attaches `req.user = { userId, email }` on success
- Calls `next()` or returns 401

**Done means**: Adding `authenticate` middleware to any route blocks requests without a valid token. Valid tokens pass through with `req.user` populated.

#### 2.3 Frontend auth pages + Redux auth slice
- Login page (`/login`) and Register page (`/register`) with forms
- `authSlice.js` — stores `{ user, isAuthenticated, loading }`
- `authService.js` — wraps register/login/logout/me API calls
- Protected route component that redirects to `/login` if not authenticated

**Done means**: A user can register in the browser, be redirected to the dashboard, refresh the page and remain logged in (cookie persists), then log out and be redirected to login.

---

## Phase 3 — CRUD API Endpoints

**Goal**: Full REST API for expenses, categories, and budgets. All endpoints authenticated.

### Tasks

#### 3.1 Expenses API
- `GET /api/v1/expenses` — list with query params: `startDate`, `endDate`, `categoryId`, `search`, `minAmount`, `maxAmount`, `page`, `limit`
- `POST /api/v1/expenses` — create (validate: amount > 0, valid categoryId, valid date)
- `PUT /api/v1/expenses/:id` — update (user must own the expense)
- `DELETE /api/v1/expenses/:id` — delete (user must own the expense)
- `GET /api/v1/expenses/summary` — returns totals by category for a given month

**Done means**: All 5 endpoints return correct data and status codes. Filtering by date range returns only matching expenses. Ownership check prevents user A from deleting user B's expense (returns 403).

#### 3.2 Categories API
- `GET /api/v1/categories` — list user's categories
- `POST /api/v1/categories` — create custom category (name, color)
- `PUT /api/v1/categories/:id` — rename or recolor
- `DELETE /api/v1/categories/:id` — only if no expenses reference it (return 422 otherwise)

**Done means**: Default categories appear immediately after registration. Custom category creation validates uniqueness per user. Deleting a category with linked expenses returns a descriptive error.

#### 3.3 Budgets API
- `GET /api/v1/budgets?month=YYYY-MM` — list budgets for a month with spent amount included
- `PUT /api/v1/budgets/:categoryId` — upsert budget for a category+month
- `DELETE /api/v1/budgets/:categoryId?month=YYYY-MM` — remove budget

**Done means**: Budgets endpoint returns `{ category, budgetAmount, spentAmount, percentUsed }` for each budgeted category. Setting then deleting a budget for a month works correctly.

---

## Phase 4 — Frontend Pages

**Goal**: All main UI views connected to the API.

### Tasks

#### 4.1 Expense list page (`/expenses`)
- Table/card list of expenses, paginated
- Filter bar: date range pickers, category multi-select, amount range, search box
- Add expense button → modal form
- Row actions: edit (inline modal), delete (confirm dialog)
- Empty state when no expenses match filters

**Done means**: User can add an expense, see it appear in the list, edit it, and delete it. Filters narrow the list in real time. Pagination works for > 20 expenses.

#### 4.2 Budgets page (`/budgets`)
- List of categories with budget input fields
- Progress bar per category showing spent/budget
- Overspend indicator (red badge, "Over budget by ₹X")
- Month selector to view/set budgets for any month
- Save all budgets button with optimistic UI update

**Done means**: Setting a budget and adding expenses that exceed it triggers the overspend indicator. Changing the month selector shows correct spending data for that month.

#### 4.3 Dashboard page (`/`)
- Summary cards: this month total, last month total, number of expenses this month
- Recent 5 expenses
- Category budget progress cards
- Placeholder chart containers (wired up in Phase 5)

**Done means**: Dashboard loads data for the current month on mount. Summary cards show correct totals. Budget cards link to the Budgets page.

#### 4.4 Settings page (`/settings`)
- Update display name
- Change password (current password + new password + confirm)
- Delete account (requires typing "DELETE" to confirm)
- Theme toggle (dark/light) — also accessible from the navbar

**Done means**: Name update persists after page refresh. Password change invalidates the current session. Account deletion removes all user data and redirects to register.

---

## Phase 5 — Charts & Data Visualization

**Goal**: Visual spending insights using Recharts.

### Tasks

#### 5.1 Category breakdown pie chart
- Recharts `PieChart` on the dashboard
- Data: spending by category for current month from `/api/v1/expenses/summary`
- Colors match category colors stored in DB
- Tooltip shows category name + amount + percentage
- Legend below chart

**Done means**: Chart renders with real data, updates when expenses are added, shows "No data" state when no expenses exist for the month.

#### 5.2 Monthly trend bar chart
- Recharts `BarChart` — last 6 months of total spending
- X-axis: month labels (Jan, Feb…), Y-axis: INR amount
- Single bar per month, colored by theme primary color
- Tooltip shows exact total

**Done means**: Chart shows 6 bars with correct totals. Correctly handles months with zero spending (bar at 0, not missing).

#### 5.3 Budget vs. actual grouped bar chart (Budgets page)
- For each budgeted category: side-by-side bars for Budget and Spent
- Over-budget bars shown in red
- Renders only for the selected month

**Done means**: Chart and progress bar cards show the same numbers. Over-budget bars are visually distinct.

---

## Phase 6 — Polish

**Goal**: Production-quality UX, CSV export, and validation hardening.

### Tasks

#### 6.1 Dark mode
- Tailwind `dark:` classes on all components
- Toggle stored in `localStorage`, applied on app load before first render (no flash)
- System preference used as default on first visit

**Done means**: Toggling dark mode instantly switches theme across all pages. Refreshing the page preserves the chosen theme. No white flash on load in dark mode.

#### 6.2 CSV export
- Button on Expenses page: "Export CSV"
- Exports currently filtered expenses (respects all active filters)
- Server endpoint `GET /api/v1/expenses/export?...same query params...`
- Response: `Content-Type: text/csv`, correct `Content-Disposition` header
- Columns: Date, Category, Amount (₹), Notes

**Done means**: Clicking Export with filters active downloads a `.csv` containing only the filtered rows. Opening in Excel/Google Sheets shows correct columns and values with INR amounts as decimals (e.g., 1500.00, not 150000).

#### 6.3 Input validation & error handling
- Frontend: Zod schema validation on all forms before submission
- Backend: validate all inputs in controller layer, return 422 with field-level errors
- Field-level error messages displayed beneath inputs
- Toast notifications for success/error on all mutations
- Global error boundary in React catches unexpected errors

**Done means**: Submitting an expense with amount = 0, missing category, or future date shows specific inline errors. Network errors show a toast. The app never shows a blank white screen from an unhandled error.

#### 6.4 Performance & accessibility
- Lazy load route components (`React.lazy` + `Suspense`)
- All interactive elements have `aria-label` or visible label
- Color contrast meets WCAG AA in both light and dark modes
- Run Lighthouse audit — score > 85 on Performance, Accessibility, Best Practices

**Done means**: Lighthouse CI passes with scores > 85. Tab navigation works through all forms. No accessibility errors in browser DevTools.

---

## Milestone Summary

| Phase | Deliverable | Depends On |
|---|---|---|
| 1 | DB schema + models | — |
| 2 | Auth (register/login/JWT) | Phase 1 |
| 3 | Full REST API | Phases 1, 2 |
| 4 | All frontend pages | Phase 3 |
| 5 | Charts | Phase 4 |
| 6 | Polish + export | Phases 4, 5 |
