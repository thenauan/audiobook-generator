import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import './platform';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './app/ErrorBoundary';
import { loadSettingsFromDisk } from './lib/settingsSync';

// Os ajustes salvos em disco são carregados antes de o app abrir
loadSettingsFromDisk().finally(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Respeita "Reduzir movimento" do sistema */}
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MotionConfig>
  </StrictMode>,
));
