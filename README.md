# QuizMaster Constructor

Платформа для проведения викторин в двух форматах:

- **«Кто хочет стать миллионером?»** — 15 вопросов, лестница сумм, несгораемые рубежи, подсказки.
- **«Своя игра»** — табло тем и стоимостей, раунды, «Кот в мешке», «Аукцион», финал.

Авторы создают игры и запускают сессии. Игрокам аккаунт не нужен: они входят по коду комнаты, выбирают имя и отвечают со своих устройств.

## Стек

- Vite 4 + React 18 + TypeScript
- Firebase Auth (авторы) + Firestore (Spark)
- GitHub Pages

## Быстрый старт

```powershell
npm install
npm run dev -w packages/web
# http://localhost:5173/QuizMaster/
```

Сборка:

```powershell
npm run build -w packages/shared
npm run build -w packages/web
```

Тесты:

```powershell
npm run test:unit
```

Деплой правил Firestore:

```powershell
firebase deploy --only firestore
```

Публикация фронтенда — автоматически через GitHub Actions при push в `master` (ветка `gh-pages`).

## Структура

```
packages/shared   типы и игровая логика + unit-тесты
packages/web      React SPA
firestore.rules   правила безопасности
```

Подробности для разработчика — в `AGENTS.md`.
