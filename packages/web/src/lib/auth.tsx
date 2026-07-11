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

const AUTH_DOMAIN = '@quizmaster.app';

function loginToEmail(login: string): string {
  return `${login.toLowerCase().replace(/[^a-z0-9_-]/g, '')}${AUTH_DOMAIN}`;
}

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  userLogin: string | null;
  login: (login: string, password: string) => Promise<void>;
  register: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, loading: true, isAdmin: false, userLogin: null,
  login: async () => {}, register: async () => {}, logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLogin, setUserLogin] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        const data = snap.data();
        setIsAdmin(data?.role === 'admin');
        setUserLogin(data?.login || null);
      } else {
        setIsAdmin(false);
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
      login: loginName, email, role: 'player', createdAt: new Date().toISOString(),
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, userLogin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
