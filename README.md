# SNA Demo — Full-Stack App

A minimal full-stack demo: React + Apollo Client → Express + Apollo Server + SQLite.

## Architecture

```
frontend/   React + Vite + Apollo Client + React Router  (port 5173)
backend/    Express + Apollo Server + SQLite + JWT        (port 4040)
```

## Seeded Credentials

| Role   | Email            | Password    |
|--------|------------------|-------------|
| VIEWER | viewer@test.com  | password123 |

Seeded Study: **STUDY-001** — "Sample Clinical Study"

---

## Running the Backend

```bash
cd backend
npm install
npm run dev
```

GraphQL endpoint: http://localhost:4040/graphql

The database is created at `backend/data/app.db` on first run.  
Seed data (user + study) is inserted automatically if not already present.

---

## Running the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## Usage Flow

1. Open http://localhost:5173 — redirects to `/login`
2. Credentials are pre-filled; click **Sign In**
3. On success, redirected to `/study/1` showing the seeded study
4. Click **Logout** to return to the login page

---

## GraphQL API

| Operation              | Auth required | Description              |
|------------------------|---------------|--------------------------|
| `query me`             | ✅            | Returns current user     |
| `query getStudy(id)`   | ✅            | Returns a study by ID    |
| `mutation login(...)`  | ❌            | Returns JWT + user       |

---

## Environment Variables

**backend/.env**
```
PORT=4000
JWT_SECRET=super-secret-jwt-key-change-in-production
DB_PATH=./data/app.db
```

**frontend/.env**
```
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```
