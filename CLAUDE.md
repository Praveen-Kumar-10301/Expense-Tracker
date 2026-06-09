# Expense Tracker — Claude Code Conventions

## Project Overview
Personal Expense Tracker app. Users track expenses, set category budgets, and visualize spending trends.

- Frontend: `/client` (React 18 + RTK + Vite + Tailwind CSS)
- Backend: `/server` (Node.js + Express.js REST API)
- Database: SQLite via `better-sqlite3` at `/server/db/expense_tracker.db`

---

## Language & Module System
- **ES Modules** throughout (`"type": "module"` in both package.json files)
- Use `import`/`export`, never `require()`
- All async operations use `async/await`, never raw `.then()` chains
- No `var` — use `const` by default, `let` only when reassignment is needed

---

## Naming Conventions
| Context | Convention | Example |
|---|---|---|
| JS variables/functions | camelCase | `getUserExpenses` |
| React components | PascalCase | `ExpenseCard.jsx` |
| Files (non-component) | camelCase | `authService.js` |
| CSS classes | Tailwind utility classes | `className="flex gap-4"` |
| DB columns | snake_case | `created_at`, `user_id` |
| Environment variables | SCREAMING_SNAKE_CASE | `JWT_SECRET` |

---

## API Design
- **Base prefix**: `/api/v1`
- RESTful resource naming: `/api/v1/expenses`, `/api/v1/budgets`
- All responses are JSON
- Success responses include the resource or `{ message: string }`
- **Error response shape** (always):
  ```json
  { "error": "Human-readable message", "code": 400 }
  ```
- HTTP status codes must match the `code` field in error responses
- Use 401 for unauthenticated, 403 for unauthorized, 404 for not found, 422 for validation errors

---

## Money Handling
- **All monetary values are stored as integers (paise / smallest INR unit)**
- Example: ₹150.75 is stored as `15075`
- Division by 100 only happens at the presentation layer
- Never use `parseFloat` for money — use integer arithmetic only
- Helper: `formatCurrency(paise)` in `/client/src/utils/currency.js`

---

## Database (SQLite / better-sqlite3)
- All DB access goes through model files in `/server/models/`
- Use **prepared statements** — never string-interpolate SQL
- Migrations live in `/server/db/migrations/` — numbered sequentially (`001_init.sql`, `002_add_budgets.sql`)
- Run migrations on server start via `db/migrate.js`
- Timestamps: store as ISO 8601 strings (`TEXT` column), set default `CURRENT_TIMESTAMP`

---

## Auth
- JWT tokens issued on login, stored in `httpOnly` cookies (not localStorage)
- Token payload: `{ userId, email, iat, exp }`
- Token expiry: `7d`
- Protect routes with `middleware/auth.js` — attach `req.user` on success
- Passwords hashed with `bcrypt`, saltRounds = 12

---

## React / Frontend
- Functional components only — no class components
- Custom hooks in `/client/src/hooks/` prefixed with `use` (e.g., `useExpenses.js`)
- API calls go through service modules in `/client/src/services/` — never `fetch` directly in components
- RTK slices in `/client/src/store/` — one slice per resource (`expensesSlice.js`, etc.)
- Global state: auth, expenses, categories, budgets — all in Redux store
- Local UI state (modals, form inputs) stays in component with `useState`
- Tailwind for all styling — no separate CSS files except `index.css` for globals

---

## Testing
- **Backend**: Vitest in `/server/tests/` — test controllers and services
- **Frontend**: React Testing Library + Vitest in `*.test.jsx` co-located with components
- Test file naming: `expenseController.test.js`, `ExpenseCard.test.jsx`
- Mock the DB layer in backend tests, not HTTP layer
- Run backend tests: `cd server && npm test`
- Run frontend tests: `cd client && npm test`

---

## File Structure Rules
- One component per file
- Index barrel exports only where it meaningfully reduces import verbosity
- Keep components under 200 lines — extract sub-components or hooks if longer
- No business logic in route files — routes call controllers, controllers call services

---

## Environment Variables
- Backend reads from `/server/.env` (never committed)
- Frontend reads from `/client/.env` (Vite exposes `VITE_` prefixed vars only)
- Template files: `/server/.env.example`, `/client/.env.example`
- Required backend vars: `JWT_SECRET`, `PORT`, `NODE_ENV`
- Required frontend vars: `VITE_API_BASE_URL`
