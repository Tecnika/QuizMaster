import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { IconDice } from './components/icons';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CabinetPage from './pages/CabinetPage';
import NewGamePage from './pages/NewGamePage';
import GameEditorPage from './pages/GameEditorPage';
import SessionHostPage from './pages/SessionHostPage';
import JoinPage from './pages/JoinPage';
import PlayerPage from './pages/PlayerPage';
import RulesPage from './pages/RulesPage';

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="qm-container qm-container-narrow">
        <div className="qm-card qm-center">Загрузка…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const bare = location.pathname.startsWith('/play/') || location.pathname.startsWith('/session/');
  if (bare) return children;
  return (
    <div className="qm-app">
      <NavBar />
      <div className="qm-container">{children}</div>
    </div>
  );
}

function NavBar() {
  const { user, userLogin, logout } = useAuth();
  return (
    <nav className="qm-nav">
      <a className="qm-nav-brand" href="/QuizMaster/">
        <IconDice size={22} /> QuizMaster
      </a>
      {user && <a className="qm-nav-link" href="/QuizMaster/cabinet">Кабинет</a>}
      <a className="qm-nav-link" href="/QuizMaster/join">Присоединиться</a>
      <a className="qm-nav-link" href="/QuizMaster/rules">Правила</a>
      <span className="qm-nav-spacer" />
      {user ? (
        <>
          <span className="qm-nav-user">{userLogin || 'автор'}</span>
          <button
            className="qm-btn qm-btn-ghost qm-btn-sm"
            onClick={() => { void logout(); }}
          >
            Выйти
          </button>
        </>
      ) : (
        <>
          <a className="qm-nav-link" href="/QuizMaster/login">Вход</a>
          <a className="qm-btn qm-btn-gold qm-btn-sm" href="/QuizMaster/register">Регистрация</a>
        </>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/join/:code" element={<JoinPage />} />
          <Route path="/play/:sessionId" element={<PlayerPage />} />
          <Route path="/cabinet" element={<Protected><CabinetPage /></Protected>} />
          <Route path="/games/new" element={<Protected><NewGamePage /></Protected>} />
          <Route path="/games/:gameId/edit" element={<Protected><GameEditorPage /></Protected>} />
          <Route path="/session/:sessionId" element={<Protected><SessionHostPage /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </AuthProvider>
  );
}
