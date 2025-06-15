// src/index.js - Updated to import the new index.css file
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Import the newly created CSS file

// Just in case the CSS file doesn't get applied correctly,
// we'll add this fallback function to ensure minimal styling
const ensureMinimalStyling = () => {
  // Check if a style element with our ID already exists
  if (!document.getElementById('minimal-styling-fallback')) {
    const style = document.createElement('style');
    style.id = 'minimal-styling-fallback';
    style.textContent = `
      /* Only essential styles to ensure the layout works */
      body { margin: 0; padding: 0; height: 100vh; background-color: #1e293b; color: #f1f5f9; }
      #root { height: 100vh; }
      .flex { display: flex; }
      .flex-col { flex-direction: column; }
      .flex-1 { flex: 1 1 0%; }
      .h-full { height: 100%; }
    `;
    document.head.appendChild(style);
  }
};

// Call the function to ensure minimal styling
ensureMinimalStyling();

// Log a message to confirm the script ran
console.log('React app initializing with proper styling');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);