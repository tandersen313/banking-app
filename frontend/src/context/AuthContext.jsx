import { createContext, useContext, useState } from 'react';

// AuthContext lets any component in the app check who is logged in
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // On page load, restore the user from localStorage if they were already logged in
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  function login(userData, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shortcut hook — use this in any component to get the current user
export function useAuth() {
  return useContext(AuthContext);
}
