# 🚀 SubSpace — Automated Subscription Management System

[![CI](https://github.com/pranavchahartech/Subscription-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/pranavchahartech/Subscription-Tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**SubSpace** is a full-stack, automated subscription tracking and budget management web application designed to optimise recurring expenses, eliminate unused subscriptions, and prevent surprise billing renewals.

---

## 📌 Features

- 📊 **Real-time Spend Telemetry**: Monthly and annual expenditure totals, budget cap tracking, and 6-month spend trend analysis.
- ⏳ **Automated Renewal Reminders**: Daily background cron job (`node-cron`) checking renewals and dispatching email alerts for items renewing within 7 days.
- 🎯 **Budget Intelligence**: Dynamic monthly spending limit cap with automatic overflow warning alerts.
- 🔍 **Filtering & Search**: Real-time filtering by subscription status (`Active`, `Unused`, `Review`, `Inactive`), category, and search terms.
- 📁 **Data Portability**: Instant CSV export for offline auditing.
- 🛡️ **Secure Authentication**: HttpOnly cookie-based JWT authentication with token rotation, bcrypt password hashing, and rate limiting.
- 🧪 **Offline Demo Mode**: When the backend is unreachable, the UI transparently falls back to mock data and shows a persistent "Demo Mode" banner.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Recharts, Lucide React, Axios |
| **Backend** | Node.js, Express, Zod v3 validation, Pino Logger, node-cron, Nodemailer |
| **Database** | PostgreSQL 15 |
| **DevOps & Testing** | Docker, Docker Compose, Jest (Backend), Vitest (Frontend), GitHub Actions CI |

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client["React / Vite Frontend\n(Port 5173)"] -->|HTTP / Cookies| API["Express REST API\n(Port 4000)"]
    API -->|Validation| Zod["Zod Schemas"]
    API -->|Queries| DB[("PostgreSQL Database\n(Port 5432)")]
    Cron["node-cron Job\n(Runs 08:00 daily)"] -->|Query Renewals| DB
    Cron -->|Send Alerts| Mail["Nodemailer SMTP"]
    Client -->|Offline fallback| Mock["Demo Mode\n(mock data in client.js)"]
```

---

## 🚀 Quick Start (Docker Compose)

The easiest way to run SubSpace locally is using **Docker Compose**:

### 1. Clone the repository

```bash
git clone https://github.com/pranavchahartech/Subscription-Tracker.git
cd Subscription-Tracker
```

### 2. Configure environment variables

Copy the `.env.example` files to `.env` and fill in real values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

See the [Environment Variables](#-environment-variables-reference) section for what each variable does.

### 3. Spin up containers

```bash
docker-compose up -d --build
```

### 4. Access the application

| Service | URL |
| :--- | :--- |
| **Frontend UI** | `http://localhost:5173` |
| **Backend API** | `http://localhost:4000` |
| **API Docs (dev-only)** | `http://localhost:4000/api-docs` |
| **Health Check** | `http://localhost:4000/health` |

> **Demo account**: A seeded demo user is created automatically on first boot — `demo@subspace.com` / `password123`.

---

## 🔑 Environment Variables Reference

### Root `.env` (used by Docker Compose)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `POSTGRES_DB` | PostgreSQL database name | `subscriptions` |
| `POSTGRES_USER` | PostgreSQL username | `admin` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `secret` |
| `DATABASE_URL` | Full PostgreSQL connection string | `postgres://admin:secret@postgres:5432/subscriptions` |

### `backend/.env`

| Variable | Description | Required |
| :--- | :--- | :--- |
| `PORT` | Backend server port | No (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `JWT_SECRET` | Access token signing key (min 32 chars) | ✅ Yes |
| `JWT_REFRESH_SECRET` | Refresh token signing key (min 32 chars) | ✅ Yes |
| `JWT_RESET_SECRET` | Password reset token signing key (min 32 chars) | ✅ Yes |
| `SMTP_HOST` | SMTP server hostname | No (default `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port | No (default `587`) |
| `SMTP_USER` | SMTP authentication user | No |
| `SMTP_PASS` | SMTP authentication password / app password | No |

### `frontend/.env`

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000` |

---

## 📑 API Summary

Detailed interactive Swagger documentation is available locally at **`http://localhost:4000/api-docs`** *(dev-only — disabled in production)*.

### Auth Endpoints (`/api/auth`)

| Method | Route | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/register` | No | Create user account & set cookies |
| `POST` | `/login` | No | Authenticate & issue token pair |
| `POST` | `/refresh` | Cookie | Rotate refresh token & issue new pair |
| `POST` | `/logout` | No | Revoke token & clear cookies |
| `GET` | `/me` | ✅ | Get authenticated user profile |
| `PUT` | `/budget` | ✅ | Update monthly budget cap |
| `POST` | `/forgot-password` | No | Send OTP to registered email (rate-limited) |
| `POST` | `/verify-reset-code` | No | Verify 6-digit OTP, return reset token |
| `POST` | `/reset-password` | No | Set new password using reset token |

### Subscription Endpoints (`/api/subscriptions`)

All routes require authentication.

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | List all user subscriptions |
| `POST` | `/` | Create a new subscription |
| `PUT` | `/:id` | Update an existing subscription |
| `DELETE` | `/:id` | Soft-delete a subscription |
| `GET` | `/summary` | Retrieve dashboard aggregated telemetry |
| `GET` | `/export/csv` | Download subscriptions as a CSV file |

---

## 🧪 Running Tests

### Backend — Unit & Integration Tests (Jest)

```bash
cd backend
npm test
```

Tests mock the database module — **no PostgreSQL instance required** to run the test suite locally.

### Frontend — Component Tests (Vitest)

```bash
cd frontend
npm test
```

All API calls are mocked via `vi.mock` — no backend needed.

### CI

The GitHub Actions workflow at [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs both test suites automatically on every push and pull request to `main`. The backend job uses a PostgreSQL 15 service container for full integration coverage.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup instructions, PR guidelines, and code style rules.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
