import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isValidLogin, useAuth } from '../lib/auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidLogin(loginName.trim())) {
      setError('Логин: 3–20 символов, только латиница, цифры и «_»');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setBusy(true);
    try {
      await register(loginName.trim(), password);
      navigate('/cabinet');
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'Такой логин уже занят'
          : err.code === 'auth/weak-password'
            ? 'Пароль слишком короткий'
            : err.code === 'auth/invalid-email'
              ? 'Логин содержит недопустимые символы'
              : err.message;
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qm-container-narrow" style={{ margin: '0 auto' }}>
      <div className="qm-card">
        <div className="qm-eyebrow">Новый автор</div>
        <h1 className="qm-title">Регистрация</h1>
        <p className="qm-subtitle qm-mb">Аккаунт нужен только тем, кто создаёт игры.</p>
        <form onSubmit={handleSubmit}>
          <div className="qm-field">
            <label className="qm-label" htmlFor="login">Логин</label>
            <input
              id="login" className="qm-input" type="text" autoComplete="username"
              placeholder="латиница, цифры, «_»" value={loginName}
              onChange={(e) => setLoginName(e.target.value)} required
            />
          </div>
          <div className="qm-field">
            <label className="qm-label" htmlFor="password">Пароль</label>
            <input
              id="password" className="qm-input" type="password" autoComplete="new-password"
              placeholder="минимум 6 символов" value={password}
              onChange={(e) => setPassword(e.target.value)} required
            />
          </div>
          <div className="qm-field">
            <label className="qm-label" htmlFor="confirm">Повторите пароль</label>
            <input
              id="confirm" className="qm-input" type="password" autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            />
          </div>
          {error && <p className="qm-danger-text" style={{ marginTop: 0 }}>{error}</p>}
          <button className="qm-btn qm-btn-primary qm-btn-block qm-btn-lg" type="submit" disabled={busy}>
            {busy ? 'Создаём…' : 'Создать аккаунт'}
          </button>
        </form>
        <p className="qm-center qm-mt">
          Уже есть аккаунт? <Link className="qm-link" to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
