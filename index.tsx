
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical: Root element not found");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React Rendering Error:", error);
    rootElement.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; font-family:sans-serif; padding: 20px;">
        <h1 style="color:#e11d48;">حدث خطأ أثناء تشغيل التطبيق</h1>
        <p style="color:#475569;">يرجى تحديث الصفحة أو التحقق من اتصال الإنترنت.</p>
        <pre style="background:#f1f5f9; padding:10px; border-radius:8px; font-size:12px; max-width:100%; overflow:auto;">${error}</pre>
      </div>
    `;
  }
}
