# QuizMaster Constructor — Developer Guide

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev -w packages/web` | Dev-сервер (http://localhost:5173/QuizMaster/) |
| `npm run build -w packages/shared` | Сборка общих типов и логики |
| `npm run build -w packages/web` | Сборка SPA |
| `npm run test:unit` | Unit-тесты (Jest) |
| `firebase deploy --only firestore` | Деплой правил и индексов Firestore |
| `npx gh-pages --dist packages/web/dist --dotfiles --no-history` | Ручной деплой фронтенда (запасной вариант) |

CI: `.github/workflows/deploy.yml` — на push в `master` запускает тесты, сборку и публикацию на GitHub Pages.

## Architecture

- **Monorepo** с npm workspaces.
- `packages/shared` — типы, игровая логика (лестница, счёт, табло, коды), unit-тесты.
- `packages/web` — Vite 4 + React 18 + TypeScript SPA.
- **Backend:** Firebase Auth (только авторы) + Firestore. Cloud Functions не используем (Spark).
- **Hosting:** GitHub Pages, базовый путь `/QuizMaster/`.
- **Routing:** `BrowserRouter basename="/QuizMaster"`; прямые ссылки — через `404.html` + `sessionStorage`.

## Data model

```
users/{uid}                        login, email, role, createdAt
games/{gameId}                     title, description, type, authorId, status, settings
games/{gameId}/questions/{qid}     вопрос (правильный ответ — только для автора)
joinCodes/{code}                   sessionId, hostId
sessions/{sessionId}               gameId, gameType, hostId, code, status, publicQuestion,
                                   revealedCorrectIndex, revealedAnswer, turn, board, ...
sessions/{sid}/participants/{pid}  name, score, color
sessions/{sid}/claims/{pid}        публичная метка «имя занято»
sessions/{sid}/tokens/{pid}        секретный токен игрока (читает только ведущий)
sessions/{sid}/answers/{aid}      participantId, questionId, token, type, choice, text
media/{mediaId}                    dataUrl, kind, authorId, name, mime, size
```

## Security model

- Автор создаёт игры/вопросы и проводит сессии. Вопросы **не читаются игроками** — в них правильные ответы.
- Игроки **не проходят Firebase Auth**. Код комнаты → `joinCodes` → `sessionId` → выбор имени → локальный токен.
- `tokens` создаётся один раз; `answers` создаётся только с совпадающим токеном. Ответы читает только ведущий.
- Публичный снимок вопроса в сессии не содержит правильного ответа; ведущий раскрывает его отдельно.
- Медиатека `media` доступна на чтение всем (игрокам и экрану), запись — только автору файла; `list` закрыт.
- Правила покрыты сквозным REST-тестом (27 проверок).

## Design

- Сайт: настольная игра — дерево, бумага, карточки, фишки, тёплые цвета (`src/global.css`).
- «Миллионер»: тёмно-синий/фиолетовый зал, золото, лестница, варианты-плитки (`.tv-millionaire`).
- «Своя игра»: синий зал, золотое табло (`.tv-svoya`).
- «Угадай мелодию»: сливовый зал, золотые ноты и растущий приз (`.tv-melody`).
- Экраны игроков — отдельный мобильный стиль (`.player-screen`).

## Key modules

| Module | File | Purpose |
|--------|------|---------|
| Auth | `packages/web/src/lib/auth.tsx` | Firebase Auth авторов, логин → email |
| Firebase | `packages/web/src/lib/firebase.ts` | Инициализация |
| Sessions | `packages/web/src/lib/session.ts` | Код, claim, токен, ответы, подписки |
| Millionaire logic | `packages/shared/src/utils/millionaire.ts` | Лестница, несгораемые, 50/50 |
| Svoya logic | `packages/shared/src/utils/svoya.ts` | Табло, очки, финал |
| Melody logic | `packages/shared/src/utils/melody.ts` | Туры, растущий приз, торги, суперигра |
| Media library | `packages/web/src/lib/media.ts` | Сжатие картинок, загрузка файлов в Firestore |
| Media fields | `packages/web/src/components/MediaField.tsx` | Загрузка файла или ссылка, превью |
| Codes | `packages/shared/src/utils/code.ts` | Коды комнат и токены |
| Rules | `firestore.rules` | Вся безопасность |
| Design | `packages/web/src/global.css` | Настольная и ТВ-стилистика |

## Env variables

- `packages/web/.env.local` — локальные ключи Firebase (gitignored).
- `packages/web/.env.production` — публичный Firebase-конфиг для CI (можно коммитить).
