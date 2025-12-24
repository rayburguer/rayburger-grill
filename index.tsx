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
  // EMERGENCY SERVICE WORKER DEACTIVATION
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (let registration of registrations) {
        registration.unregister();
      }
    });
  }
} else {
  console.error('Failed to find the root element to mount the React application.');
}