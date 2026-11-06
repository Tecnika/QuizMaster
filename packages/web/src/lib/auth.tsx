import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserRole } from '@quizmaster/shared';

const AUTH_DOMAIN = '@quizmaster.app';

export function loginToEmail(login: string): string {
  return `${login.toLowerCase().replace(/[^a-z0-9_-]/g, '')}${AUTH_DOMAIN}`;
}

export function isValidLogin(login: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(login);
}

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
  role: UserRole | null;
  userLogin: string | null;
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  role: null,
  userLogin: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userLogin, setUserLogin] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          const data = snap.data();
          setRole((data?.role as UserRole) || 'author');
          setUserLogin(data?.login || null);
        } catch {
          setRole('author');
          setUserLogin(null);
        }
      } else {
        setRole(null);
        setUserLogin(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (loginName: string, password: string) => {
    await signInWithEmailAndPassword(auth, loginToEmail(loginName), password);
  }, []);

  const register = useCallback(async (loginName: string, password: string) => {
    const email = loginToEmail(loginName);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      login: loginName,
      email,
      role: 'author',
      createdAt: new Date().toISOString(),
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role, userLogin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
