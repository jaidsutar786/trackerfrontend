import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/authService';
import websocketService from '../services/websocketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data);
          // WebSocket connection is now handled by NotificationContext
          // Just set connected status
          setWsConnected(true);
        })
        .catch(() => {
          sessionStorage.clear();
          websocketService.disconnect();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    sessionStorage.clear();
    websocketService.disconnect();
    setUser(null);
    setWsConnected(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading, wsConnected }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
