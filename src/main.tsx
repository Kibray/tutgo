import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { TelegramProvider } from "./hooks/useTelegram.tsx";

createRoot(document.getElementById("root")!).render(
  <TelegramProvider>
    <App />
  </TelegramProvider>
);

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com') ||
  window.location.hostname.includes('lovable.app');

if ('serviceWorker' in navigator) {
  if (isPreviewHost || isInIframe) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}
