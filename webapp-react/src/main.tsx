import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error boundary для отлова ошибок при инициализации
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to initialize app:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Ошибка загрузки приложения</h1>
      <p>Не удалось инициализировать приложение. Проверьте консоль для деталей.</p>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}
