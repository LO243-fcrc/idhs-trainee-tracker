import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

// Decodes the JWT payload client-side (no verification - the backend is the source of truth
// on every request; this is purely for deciding what to render and show the logged-in user).
function decodeSessionToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded; // { userId, email, name, exp, iat }
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      const decoded = decodeSessionToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        localStorage.removeItem('sessionToken');
      }
    }
    setIsLoading(false);
  }, []);

  function login(token) {
    localStorage.setItem('sessionToken', token);
    setUser(decodeSessionToken(token));
  }

  function logout() {
    localStorage.removeItem('sessionToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
