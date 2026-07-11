import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(loginName, password);
      nav('/admin');
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Такой логин уже занят'
        : err.code === 'auth/invalid-email' ? 'Логин содержит недопустимые символы'
        : err.code === 'auth/weak-password' ? 'Пароль слишком короткий (минимум 6 символов)'
        : err.message;
      setError(msg);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: '100px auto', padding: '2rem' }}>
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Логин" value={loginName} onChange={(e) => setLoginName(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Зарегистрироваться</button>
      </form>
      <p style={{ marginTop: '1rem' }}><Link to="/login">Уже есть аккаунт?</Link></p>
    </main>
  );
}
