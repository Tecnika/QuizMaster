import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, displayName);
      nav('/admin');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: '100px auto', padding: '2rem' }}>
      <h1>Регистрация</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="text" placeholder="Имя" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Зарегистрироваться</button>
      </form>
      <p style={{ marginTop: '1rem' }}><Link to="/login">Уже есть аккаунт?</Link></p>
    </main>
  );
}
