import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './global.css';
import App from './App';

const saved = sessionStorage.getItem('redirect');
if (saved) {
  sessionStorage.removeItem('redirect');
  const url = new URL(saved);
  if (url.pathname !== '/QuizMaster/') {
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/QuizMaster">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
