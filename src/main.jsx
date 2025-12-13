import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';

const queryClient = new QueryClient();

// Register Service Worker (PWA)
registerSW({ immediate: true });

// --- AUDIO FIX START ---
let audioInitialized = false;

function initializeAudioContext() {
  if (audioInitialized) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const tempContext = new AudioContext();
  if (tempContext.state === 'suspended') {
    tempContext
      .resume()
      .then(() => {
        tempContext.close();
        audioInitialized = true;
      })
      .catch(() => {
        // leave audioInitialized false so a later gesture can retry
      });
  } else {
    tempContext.close();
    audioInitialized = true;
  }
}

document.addEventListener('click', initializeAudioContext, { once: true });
document.addEventListener('touchstart', initializeAudioContext, { once: true });
// --- AUDIO FIX END ---

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
