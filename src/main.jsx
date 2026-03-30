import React from 'react';
import ReactDOM from 'react-dom/client';
import { LocaleProvider } from './LocaleContext';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </React.StrictMode>
);
