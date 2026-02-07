import React from 'react';
import ReactDOM from 'react-dom/client';
// On précise bien .tsx pour éviter l'erreur MIME
import App from './App.tsx'; 

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}