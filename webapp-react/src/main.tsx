import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import bridge from "@vkontakte/vk-bridge";

// DEBUG: timing
(window as any).__t0 = Date.now();
(window as any).__timings = [] as string[];
(window as any).__addTiming = (label: string) => {
  const ms = Date.now() - (window as any).__t0;
  (window as any).__timings.push(`${label}: +${ms}ms`);
};

// VK Bridge init — только если открыто внутри VK (есть vk_user_id в URL)
if (new URLSearchParams(window.location.search).has("vk_user_id")) {
  (window as any).__addTiming("VKWebAppInit отправлен");
  bridge.send("VKWebAppInit").catch(() => {});
}

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
