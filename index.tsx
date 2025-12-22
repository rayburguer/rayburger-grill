import { createRoot } from 'react-dom/client';
import App from './src/App';
import './src/index.css';

import ErrorBoundary from './src/components/ui/ErrorBoundary';

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
  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
} else {
  console.error('Failed to find the root element to mount the React application.');
}