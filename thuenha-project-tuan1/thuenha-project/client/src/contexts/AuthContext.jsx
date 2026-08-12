import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cập nhật header CSRF cho mọi request của axios
  useEffect(() => {
    if (csrfToken) {
      api.defaults.headers.common['x-csrf-token'] = csrfToken;
    } else {
      delete api.defaults.headers.common['x-csrf-token'];
    }
  }, [csrfToken]);

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.user) {
        setUser(res.user);
        if (res.csrfToken) {
          setCsrfToken(res.csrfToken);
        }
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.user);
    setCsrfToken(res.csrfToken);
    return res;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    setCsrfToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, csrfToken, loading, login, logout, checkAuth }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
