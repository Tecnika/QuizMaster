import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      nav('/admin');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: '100px auto', padding: '2rem' }}>
      <h1>Вход</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Войти</button>
      </form>
      <p style={{ marginTop: '1rem' }}><Link to="/register">Регистрация</Link></p>
    </main>
  );
}
