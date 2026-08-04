# Contributing to SubSpace

Thanks for your interest in contributing! Here's everything you need to get up and running.

---

## Local Development Setup

### Prerequisites
- **Node.js** v20+
- **Docker & Docker Compose** (recommended for the full stack)
- **Git**

### 1. Clone & configure environment

```bash
git clone https://github.com/pranavchahartech/Subscription-Tracker.git
cd Subscription-Tracker

# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `.env` and `backend/.env` to fill in your JWT secrets and SMTP credentials.

### 2. Start with Docker Compose (recommended)

```bash
docker-compose up -d --build
```

The app will be available at `http://localhost:5173`. The backend API runs at `http://localhost:4000`.

### 3. Start manually (without Docker)

You need a running PostgreSQL 15 instance first.

```bash
# Backend
cd backend
npm install
npm run dev        # starts Express on port 4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev        # starts Vite on port 5173
```

---

## Running Tests

```bash
# Backend unit & integration tests (Jest)
cd backend
npm test

# Frontend component tests (Vitest)
cd frontend
npm test
```

All tests must pass before a PR can be merged. The CI pipeline runs both suites automatically on every push and pull request.

---

## Project Structure

```
.
├── backend/              # Express REST API
│   ├── src/
│   │   ├── controllers/  # Route handler logic
│   │   ├── middleware/   # Auth & validation
│   │   ├── models/       # DB pool + schema.sql
│   │   ├── routes/       # Express routers
│   │   ├── schemas/      # Zod validation schemas
│   │   ├── jobs/         # node-cron reminder job
│   │   └── utils/        # Logger, mailer
│   └── tests/            # Jest test suites
├── frontend/             # React + Vite SPA
│   └── src/
│       ├── api/          # Axios client + demo fallback
│       ├── components/   # Shared UI components
│       ├── context/      # AuthContext (session state)
│       ├── pages/        # Page-level components
│       └── tests/        # Vitest test suites
├── .github/workflows/    # GitHub Actions CI
├── docker-compose.yml
└── openapi.yaml          # (served at /api-docs in dev)
```

---

## Pull Request Guidelines

1. **Branch naming**: `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`
2. **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `test:`
3. **Tests**: Add or update tests for any new behaviour. PRs with failing tests will not be merged.
4. **One concern per PR**: Keep PRs focused. Large multi-feature PRs are hard to review.
5. **Describe your change**: Fill in the PR description — what does it do, why, and how was it tested?

---

## Code Style

- **Backend**: CommonJS modules, async/await, Pino for logging — no `console.log` in production paths
- **Frontend**: Functional React with hooks, Tailwind CSS v4, no inline style blocks unless unavoidable
- **Validation**: All API inputs validated with Zod schemas before hitting controllers

---

## Reporting Issues

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behaviour
- Node.js version, OS, and any relevant logs
