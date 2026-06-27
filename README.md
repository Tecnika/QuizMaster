# QuizMaster Constructor 🧠

[![Deploy](https://github.com/Tecnika/QuizMaster/actions/workflows/deploy.yml/badge.svg)](https://github.com/Tecnika/QuizMaster/actions/workflows/deploy.yml)

Платформа для создания и проведения интеллектуальных игр — **«Кто хочет стать миллионером?»** и **«Своя игра»**.

### Стек

- **Фронтенд**: Vite 4 + React 18, Firebase Auth, Firestore realtime
- **Бэкенд**: Firestore + security rules
- **Хостинг**: GitHub Pages (статический SPA) + Firebase (auth, firestore)
- **CI/CD**: GitHub Actions

### Быстрый старт

```bash
git clone https://github.com/Tecnika/QuizMaster.git
cd QuizMaster
npm install
npm run build
```

### Документация

- [Инструкция по деплою](DEPLOY.md) — Firebase + GitHub Pages + настройка
- [AGENTS.md](AGENTS.md) — архитектура и команды разработчика
- [CHANGELOG.md](CHANGELOG.md) — история изменений

### Структура

```
QuizMaster/
├── packages/
│   ├── shared/     # Типы + утилиты (scoring)
│   └── web/        # React SPA (Vite)
├── .github/workflows # CI/CD
├── firestore.rules   # Security rules
└── firebase.json     # Firebase config
```
