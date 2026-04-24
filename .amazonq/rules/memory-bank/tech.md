# Technology Stack

## Languages
- TypeScript 5.4 — both backend and frontend
  - Backend: `target: ES2020`, `module: commonjs`, `strict: true`
  - Frontend: `target: ES2020`, `module: ESNext`, `jsx: react-jsx`, `strict: true`, `noEmit: true`

## Backend
| Concern           | Library / Version          |
|-------------------|----------------------------|
| Runtime           | Node.js                    |
| HTTP framework    | Express 4.18               |
| GraphQL server    | Apollo Server 4.10         |
| GQL middleware    | `@apollo/server/express4`  |
| Database          | better-sqlite3 12.9 (sync) |
| Auth — tokens     | jsonwebtoken 9.0           |
| Auth — passwords  | bcryptjs 2.4               |
| Cookie parsing    | cookie-parser 1.4          |
| CORS              | cors 2.8                   |
| Validation        | zod 4.3                    |
| Dev server        | ts-node-dev 2.0            |

## Frontend
| Concern           | Library / Version          |
|-------------------|----------------------------|
| UI framework      | React 18.2                 |
| Build tool        | Vite 5.2                   |
| GraphQL client    | Apollo Client 3.9          |
| UI components     | MUI (Material UI) 9.0      |
| Data grid         | @mui/x-data-grid 9.0       |
| Icons             | @mui/icons-material 9.0    |
| Styling engine    | Emotion (react + styled)   |
| Routing           | React Router DOM 6.22      |
| Charts            | chart.js 4.5 + react-chartjs-2 5.3 |
| Forms             | react-hook-form 7.73       |
| Form validation   | zod 4.3 + @hookform/resolvers 5.2 |
| Toast/snackbar    | notistack 3.0              |

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev      # ts-node-dev --respawn --transpile-only src/server.ts
npm run build    # tsc → dist/
npm start        # node dist/server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # vite dev server
npm run build    # tsc + vite build
npm run preview  # vite preview of build output
```

## Ports & Endpoints
| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:5173            |
| Backend   | http://localhost:4040            |
| GraphQL   | http://localhost:4040/graphql    |
| Health    | http://localhost:4040/health     |

## Environment Variables

**backend/.env**
```
PORT=4040
JWT_SECRET=super-secret-jwt-key-change-in-production
DB_PATH=./data/app.db
```

**frontend/.env**
```
VITE_GRAPHQL_URL=http://localhost:4040/graphql
```

## GraphQL API

### Queries (all require auth unless noted)
| Operation                          | Auth  | Description                                    |
|------------------------------------|-------|------------------------------------------------|
| `query me`                         | ✅    | Returns current user with role                 |
| `query getStudies(page, pageSize)` | ✅    | Paginated studies → `StudyPage{rows,total}`    |
| `query getStudy(id)`               | ✅    | Single study with nested sites + examiners     |
| `query getSites(page, pageSize)`   | ✅    | Paginated sites → `SitePage{rows,total}`       |
| `query getSite(id)`                | ✅    | Single site with nested studies + examiners    |
| `query getExaminers(page,pageSize)`| ✅    | Paginated examiners → `ExaminerPage{rows,total}`|
| `query getExaminer(id)`            | ✅    | Single examiner with nested studies + sites    |
| `query globalSearch(keyword,filters)`| ✅  | Cross-entity keyword search with filters       |
| `query getAuditLogs(entityType,entityId,page,pageSize)`| 🔒 ADMIN | Paginated audit log entries ordered DESC |

### Mutations
| Operation                              | Auth       | Description                          |
|----------------------------------------|------------|--------------------------------------|
| `mutation login(email, password)`      | ❌         | Sets HttpOnly cookie, returns user+role |
| `mutation logout`                      | ✅         | Clears HttpOnly cookie               |
| `mutation createStudy(input)`          | 🔒 ADMIN   | Creates study, logs audit            |
| `mutation updateStudy(id, input)`      | 🔒 ADMIN   | Updates study, logs audit            |
| `mutation assignSiteToStudy(studyId, siteId)` | 🔒 ADMIN | Links site to study             |
| `mutation unassignSiteFromStudy(studyId, siteId)` | 🔒 ADMIN | Unlinks site from study (blocked if SSE rows exist) |
| `mutation assignExaminerToStudySite(studyId, siteId, examinerId)` | 🔒 ADMIN | Links examiner to study at a specific site (3-way SSE) |
| `mutation unassignExaminerFromStudySite(studyId, siteId, examinerId)` | 🔒 ADMIN | Unlinks examiner from study at a specific site |
| `mutation createSite(input)`           | 🔒 ADMIN   | Creates site, logs audit             |
| `mutation updateSite(id, input)`       | 🔒 ADMIN   | Updates site (domain rules apply), logs audit |
| `mutation assignExaminerToSite(siteId, examinerId)` | 🔒 ADMIN | Links examiner to site    |
| `mutation unassignExaminerFromSite(siteId, examinerId)` | 🔒 ADMIN | Unlinks examiner; auto-downgrades site if last |
| `mutation createExaminer(input)`       | 🔒 ADMIN   | Creates examiner, logs audit         |
| `mutation updateExaminer(id, input)`   | 🔒 ADMIN   | Updates examiner, logs audit         |

## Database
- Engine: SQLite via `better-sqlite3` (synchronous API)
- File: `backend/data/app.db` (auto-created on first run)
- No ORM — raw SQL with typed helpers in `db/query.ts`
- Schema + indexes + migration shims in `db/migrate.ts`
- Tables: `users`, `studies`, `sites`, `examiners`, `study_sites`, `site_examiners`, `study_site_examiners`, `audit_logs`
- Seed: 2 users (ADMIN + VIEWER), 20 studies, 20 sites, 20 examiners, ~55 study-site links, ~40 site-examiner links
- Migration shims: `ALTER TABLE ... ADD COLUMN` wrapped in try/catch for backward compatibility
