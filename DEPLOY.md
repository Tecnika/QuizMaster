# Деплой QuizMaster — пошаговая инструкция

## 1. Firestore rules + индексы

Открой **VS Code терминал** (`Ctrl+`` `) и выполни:

```powershell
# Установить firebase-tools (если ещё нет)
npm install -g firebase-tools

# Войти в Firebase
firebase login
# -> Откроется браузер, выбери аккаунт Google, разреши доступ
# -> После авторизации вернись в терминал

# Деплой Firestore rules + индексы
firebase deploy --only firestore
```

**Результат:** в Firebase появятся:
- Security rules для всех коллекций (users, games, questions, sessions, teams, answers)
- Индексы для быстрых запросов

---

## 2. GitHub Secrets (для GitHub Pages)

Зайди в **GitHub → Settings → Secrets and variables → Actions**.

Нажми **"New repository secret"** и добавь по одному:

| Secret name | Где взять |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web App → `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Authentication → `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → `Project ID` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Storage → `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Cloud Messaging → `Sender ID` |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings → Web App → `appId` |

---

## 3. Включить GitHub Pages

1. GitHub → **Settings → Pages**
2. **Source**: выбери **"GitHub Actions"**
3. Готово — теперь после каждого пуша в `master` CI будет деплоить фронтенд

---

## 4. Проверить результат

```
https://tecnika.github.io/QuizMaster/     ← фронтенд
```

Проверь в браузере:
- ✅ Открывается страница логина
- ✅ Можно зарегистрироваться
- ✅ После входа видна админка
- ✅ Можно создать игру и добавить вопросы

---

## Быстрые команды (VS Code, Ctrl+Shift+B)

| Задача | Команда |
|---|---|
| Запустить фронтенд локально | `npm run dev` (в корне) |
| Собрать всё | `npm run build` |
| Задеплоить Firestore | `firebase deploy --only firestore` |
