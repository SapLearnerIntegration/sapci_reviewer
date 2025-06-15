// Apply styles directly to avoid PostCSS processing
const applyStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        background-color: #1f2937;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .h-screen { height: 100vh; }
      .flex { display: flex; }
      .flex-1 { flex: 1 1 0%; }
      .items-center { align-items: center; }
      .justify-between { justify-content: space-between; }
    `;
    document.head.appendChild(style);
  };
  
  export default applyStyles;