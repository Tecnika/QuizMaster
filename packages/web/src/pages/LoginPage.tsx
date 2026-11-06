import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(loginName.trim(), password);
      navigate('/cabinet');
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Неверный логин или пароль'
          : err.code === 'auth/invalid-email'
            ? 'Логин содержит недопустимые символы'
            : err.code === 'auth/too-many-requests'
              ? 'Слишком много попыток. Попробуйте позже'
              : err.message;
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qm-container-narrow" style={{ margin: '0 auto' }}>
      <div className="qm-card" style={{ maxWidth: 440, margin: '0 auto' }}>
        <div className="qm-eyebrow">С возвращением</div>
        <h1 className="qm-title">Вход</h1>
        <p className="qm-subtitle qm-mb">Войдите, чтобы создавать игры и проводить сессии.</p>
        <form onSubmit={handleSubmit}>
          <div className="qm-field">
            <label className="qm-label" htmlFor="login">Логин</label>
            <input
              id="login" className="qm-input" type="text" autoComplete="username"
              placeholder="например, quizmaster" value={loginName}
              onChange={(e) => setLoginName(e.target.value)} required
            />
          </div>
          <div className="qm-field">
            <label className="qm-label" htmlFor="password">Пароль</label>
            <input
              id="password" className="qm-input" type="password" autoComplete="current-password"
              placeholder="••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
          {error && <p className="qm-danger-text" style={{ marginTop: 0 }}>{error}</p>}
          <button className="qm-btn qm-btn-primary qm-btn-block qm-btn-lg" type="submit" disabled={busy}>
            {busy ? 'Входим…' : 'Войти'}
          </button>
        </form>
        <p className="qm-center qm-mt">
          Нет аккаунта? <Link className="qm-link" to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
