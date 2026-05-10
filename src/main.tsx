import React, { StrictMode, ReactNode, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './lib/AuthContext';

interface ErrorInfo {
  componentStack: string;
}

const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{ padding: '2rem', color: 'red', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
    <h2>Error:</h2>
    {error.message}
    <br />
    {error.stack}
  </div>
);

const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: Error, info: ErrorInfo) => {
    console.error('ErrorBoundary caught:', err, info);
    setError(err);
  }, []);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  return <>{children}</>;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
