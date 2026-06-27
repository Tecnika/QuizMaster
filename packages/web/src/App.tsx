import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import NewGamePage from './pages/NewGamePage';
import EditGamePage from './pages/EditGamePage';
import HostPage from './pages/HostPage';
import PlayPage from './pages/PlayPage';
import MillionerRules from './pages/MillionerRules';
import SvoyaIgraRules from './pages/SvoyaIgraRules';
import HostingRules from './pages/HostingRules';

function ProtectedRoute({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function NavBar() {
  const { user } = useAuth();
  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
      <Link to="/" style={{ fontWeight: 'bold' }}>QuizMaster</Link>
      {user && <Link to="/admin">Админка</Link>}
      <Link to="/rules/millioner">Миллионер</Link>
      <Link to="/rules/svoya-igra">Своя игра</Link>
      <Link to="/rules/hosting">Ведущему</Link>
      <div style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            <span style={{ marginRight: '1rem' }}>{user.email}</span>
            <Link to="/login">Выйти</Link>
          </>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register" style={{ marginLeft: '1rem' }}>Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/games/new" element={<ProtectedRoute adminOnly><NewGamePage /></ProtectedRoute>} />
        <Route path="/admin/games/edit" element={<ProtectedRoute adminOnly><EditGamePage /></ProtectedRoute>} />
        <Route path="/host" element={<ProtectedRoute adminOnly><HostPage /></ProtectedRoute>} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/rules/millioner" element={<MillionerRules />} />
        <Route path="/rules/svoya-igra" element={<SvoyaIgraRules />} />
        <Route path="/rules/hosting" element={<HostingRules />} />
      </Routes>
    </AuthProvider>
  );
}

function HomePage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
      <h1>QuizMaster Constructor</h1>
      <p>Платформа для создания и проведения интеллектуальных игр</p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/login">Войти</Link>
        <Link to="/register">Регистрация</Link>
      </div>
    </main>
  );
}
