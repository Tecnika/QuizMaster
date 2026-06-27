# QuizMaster Constructor — Developer Guide

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all packages in dev mode |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run lint` | Run ESLint across all packages |
| `firebase deploy --only firestore` | Deploy Firestore rules + indexes |

## Architecture

- **Monorepo** with npm workspaces
- `packages/shared` — types and utilities shared between web and functions
- `packages/web` — Vite 4 + React 18 SPA, Firebase Client SDK (v9)
- **Backend**: Firestore + security rules (no Cloud Functions)
- **Hosting**: GitHub Pages (static SPA) + Firebase (auth, firestore)

## Data Flow

1. User actions trigger direct Firestore reads/writes from the browser
2. Firestore security rules validate access and data integrity
3. Client subscribes to Firestore via `onSnapshot` for realtime updates
4. Player joins via join code → reads session doc → submits answers

## Collections

| Collection | Purpose | Access |
|------------|---------|--------|
| `users` | User profiles | Read/write own |
| `games` | Game definitions | CRUD by author |
| `games/{id}/questions` | Questions per game | CRUD by game author |
| `sessions` | Live game sessions | Created by host |
| `teams` | Teams per session | Created by players |
| `answers` | Submitted answers | Write only |

## Key Modules

| Module | File | Purpose |
|--------|------|---------|
| Auth | `packages/web/src/lib/auth.tsx` | Firebase Auth + context |
| Firebase | `packages/web/src/lib/firebase.ts` | Firebase init + exports |
| Scoring | `packages/shared/src/utils/scoring.ts` | Score calculation logic |
| Firestore rules | `firestore.rules` | Security rules (all logic) |

## Env Variables

- `packages/web/.env.local` — VITE_FIREBASE_* keys for Firebase Client SDK
