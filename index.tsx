import { createRoot } from 'react-dom/client';
import App from './src/App';
import './src/index.css';

import ErrorBoundary from './src/components/ui/ErrorBoundary';

// GLOBAL ERROR TRAP for White Screen of Death
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message);
  // Optional: alert("Error Crítico: " + message); // Uncomment to debug broadly
};

const container = document.getElementById('root');
if (container) {
  // --- CACHE BUSTER FORCED v4 ---
  const CURRENT_APP_VERSION = '4.0.0';
  // Cache buster logic removed for stability
  // if (storedVersion !== CURRENT_APP_VERSION) { ... }
  // ------------------------------

  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  // PWA Service Worker Registration - ACTIVE for App Mode
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        // Check for updates periodically
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available; please refresh.
                  console.log('New content available, triggering reload...');
                }
              }
            };
          }
        };
      }).catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });

    // Handle the actual reload when the new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  }
} else {
  console.error('Failed to find the root element to mount the React application.');
}