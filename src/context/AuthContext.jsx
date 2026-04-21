import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { setAuthLogoutCallback } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// JWT token utility functions
const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

export const AuthProvider = ({ children }) => {
  const logoutRef = useRef(null); // Use ref to avoid dependency cycles

  const [user, setUser] = useState(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      // Check if token exists and is not expired
      if (savedToken && !isTokenExpired(savedToken) && savedUser) {
        return JSON.parse(savedUser);
      } else {
        // Clear expired data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && !isTokenExpired(savedToken)) {
      return savedToken;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  });

  // Step 1: Save current path in sessionStorage → redirect to ASP.NET backend → backend redirects to Auth0
  //         Pass this UI's callback URL so the shared backend knows where to redirect after Auth0 login
  const login = (tenantId = 2) => {
    sessionStorage.setItem('auth_redirect', window.location.pathname);
    const returnUrl = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `https://menu-card-api-yvzycdnaqq-el.a.run.app/api/auth/login/${tenantId}?returnUrl=${returnUrl}`;
  };

  // Step 2: Called by AuthCallback page after backend redirects back with token + user in query params
  //         Writes localStorage FIRST, then updates React state
  const handleCallback = ({ token: newToken, user: newUser }) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Step 3: Pop the saved redirect path from sessionStorage (defaults to /)
  const getRedirectPath = () => {
    const path = sessionStorage.getItem('auth_redirect') || '/';
    sessionStorage.removeItem('auth_redirect');
    return path;
  };

  // Logout: clear localStorage + reset state
  const logout = (isAutomatic = false) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    
    if (isAutomatic) {
      console.log('Session expired - you have been automatically logged out');
      // You could also dispatch a custom event here for other components to listen to
      window.dispatchEvent(new CustomEvent('auth-session-expired'));
    }
  };

  // Store logout function in ref to avoid dependency cycles
  logoutRef.current = logout;

  // Set up the logout callback for apiService
  useEffect(() => {
    setAuthLogoutCallback(logout);
  }, []);

  // Check token expiration every minute
  useEffect(() => {
    const checkTokenExpiration = () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && isTokenExpired(currentToken)) {
        console.log('Token expired, logging out automatically');
        logout(true); // Pass true to indicate automatic logout
      }
    };

    // Check immediately and then every 60 seconds
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, handleCallback, getRedirectPath, forceLogout: () => logoutRef.current?.(true) }}>
      {children}
    </AuthContext.Provider>
  );
};
