import { createRoot } from 'react-dom/client';
import App from './src/App';
import './src/index.css';
import { AuthProvider } from './src/context/AuthContext';

import ErrorBoundary from './src/components/ui/ErrorBoundary';

// GLOBAL ERROR TRAP for White Screen of Death
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, "Source:", source, "Line:", lineno, "Col:", colno, "Error:", error);
  // Optional: alert("Error Crítico: " + message); // Uncomment to debug broadly
};

import { BrowserRouter } from 'react-router-dom';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
  // EMERGENCY SERVICE WORKER DEACTIVATION
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
} else {
  console.error('Failed to find the root element to mount the React application.');
}