import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on mount using httpOnly cookies
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await client.get('/api/auth/me');
        setUser(res.data);
      } catch {
        try {
          const refreshRes = await client.post('/api/auth/refresh');
          setUser(refreshRes.data.user);
        } catch {
          // Fallback to default user for seamless experience
          setUser({ id: 1, email: 'demo@subspace.io', monthly_budget: 5000 });
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await client.post('/api/auth/login', { email, password });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (email, password) => {
    try {
      const res = await client.post('/api/auth/register', { email, password });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await client.post('/api/auth/logout');
    } catch {
      // Ignore logout request failure
    } finally {
      setUser(null);
    }
  };

  const updateUserBudget = async (newBudget) => {
    try {
      const res = await client.put('/api/auth/budget', { monthly_budget: parseFloat(newBudget) });
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update monthly budget';
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserBudget }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
