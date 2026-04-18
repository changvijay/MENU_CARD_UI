import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { handleCallback, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Backend redirects here with ?data=<base64 encoded JSON { success, message, user, token }>
    const dataParam = searchParams.get('data');

    if (!dataParam) {
      setError('No authentication data received');
      setTimeout(() => navigate('/', { replace: true }), 2000);
      return;
    }

    try {
      const parsed = JSON.parse(atob(dataParam));

      // Handle both PascalCase (C# default) and camelCase keys
      const success = parsed.Success ?? parsed.success;
      const message = parsed.Message ?? parsed.message;
      const user    = parsed.User    ?? parsed.user;
      const token   = parsed.Token   ?? parsed.token;

      if (!success) {
        setError(message || 'Login failed');
        setTimeout(() => navigate('/', { replace: true }), 2000);
        return;
      }

      // Write to localStorage + update AuthContext state
      handleCallback({ token, user });

      // Read saved redirect path from sessionStorage → navigate back to original page
      navigate(getRedirectPath(), { replace: true });
    } catch {
      setError('Invalid authentication data');
      setTimeout(() => navigate('/', { replace: true }), 2000);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? (
        <p className="text-red-500 font-medium">{error}</p>
      ) : (
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      )}
    </div>
  );
};

export default AuthCallback;
