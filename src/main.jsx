import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './services/AuthContext';
import { ThemeProvider } from './services/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import App from './App';
import './index.css';

// ─── Register PWA Service Worker (Phase 7, Item 71) ─────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — offline mode unavailable
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
