# Changelog

## [0.7.0] — 2026-06-27

### Changed
- **Архитектура**: Cloud Functions → чистый Firestore (client-only)
- `firestore.rules` — полная валидация доступа (автор игры, ведущий сессии, участник команды)
- `firebase.json` — убран `functions`, `hosting`, `emulators` (только firestore)
- Фронтенд: все `callFunction` заменены на прямые `addDoc`, `updateDoc`, `onSnapshot`
- `lib/firebase.ts` — удалён `getFunctions`
- `lib/auth.tsx` — удалён `callFunction`

### Removed
- `functions/` — Cloud Functions больше не нужны (экономия: не нужен Blaze)

### Added
- Firestore indexes: sessions (gameId), teams (sessionId), answers (sessionId)
- README.md с бейджами и структурой
- DEPLOY.md — пошаговая инструкция по деплою

## [0.6.0] — 2026-06-27

## [0.5.0] — 2026-06-27

### Changed
- **Архитектура**: PostgreSQL + Express → Cloud Firestore + Cloud Functions
- **Фронтенд**: Next.js 14 → Vite 4 + React 18 SPA (GitHub Pages)
- Роутинг: динамические пути `/host/:id` → query-параметры `/host?id=xxx`

### Removed
- packages/server (Express, PostgreSQL, firelink)
- Docker Compose, миграции, firebase-admin из серверного кода

### Added
- `functions/` — Cloud Functions (auth, games, questions, engine)
- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`
- `packages/web/public/404.html` — SPA fallback для GitHub Pages
- CI/CD workflow `.github/workflows/deploy.yml`

## [0.4.0] — 2026-06-27

### Added
- Export/Import JSON endpoints (GET /api/games/:id/export, POST /api/games/import)

### Frontend (Stage 4-5)
- Login page (/login) with Firebase Auth
- Registration page (/register) with API sync
- Admin dashboard (/admin) with game list
- New game page (/admin/games/new) — выбор типа
- Game editor (/admin/games/:id/edit) — редактор для обоих типов
- Host screen (/host/sessions/:id) — управление игрой
- Player display (/play/sessions/:id) — проектор с Firestore realtime подпиской
- Rules pages: /rules/millioner, /rules/svoya-igra, /rules/hosting

## [0.3.0] — 2026-06-27

### Added
- Game engine: millioner flow (next question, answer, scoring, fireproof)
- Game engine: svoya_igra flow (select cell, answer, team scoring, used cells)
- Session routes: create, start/pause/resume/finish, add teams
- Firelink sync on every state change

## [0.2.0] — 2026-06-27

### Added
- Auth routes: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- Games CRUD routes: GET/POST /api/games, GET/PUT/DELETE /api/games/:id
- Questions CRUD for "Миллионер": POST/PUT/DELETE questions-millioner
- Questions CRUD for "Своя игра": POST/PUT/DELETE questions-svoya-igra
- All routes protected with requireAuth + requireRole('admin')
- Firelink integration on question create (sync games_public)

## [0.1.0] — 2026-06-27

### Added
- Initial monorepo structure (packages: server, web, shared)
- Docker Compose for PostgreSQL 16
- Express server with health check endpoint
- PostgreSQL connection pool and transaction helper
- Firebase Admin SDK integration (initFirebase, getFirestore, getAuth)
- Firelink module: async sync from PostgreSQL to Firestore with retry queue
- Auth middleware (requireAuth, requireRole) with Firebase token verification
- Next.js 13 web app with Firebase Auth and AuthProvider
- Shared types (User, Game, Question*, Team, GameSession, FirestoreSession)
- Shared utilities: scoring calculator (millionaire rules, fireproof sums)
- Migration script for all tables (users, games, questions_*, teams, game_sessions)
- CI workflow (GitHub Actions)
- Unit tests for scoring utilities
