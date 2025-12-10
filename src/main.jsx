import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// --- AUDIO FIX START ---
// Global flag to track if the AudioContext has been initialized
let audioInitialized = false;

function initializeAudioContext() {
  if (audioInitialized) return;

  // Check if AudioContext exists
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  // Temporarily create a context and resume it
  const tempContext = new AudioContext();
  if (tempContext.state === 'suspended') {
    tempContext.resume().then(() => {
      console.log('AudioContext resumed successfully by initial click.');
      tempContext.close(); // Close the temp context
      audioInitialized = true;
    }).catch(e => {
      console.error('Failed to resume AudioContext:', e);
    });
  } else {
    tempContext.close();
    audioInitialized = true;
  }
}

// Add event listener to the entire document body for the first click
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