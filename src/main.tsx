import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { TelegramProvider } from "./hooks/useTelegram.tsx";

createRoot(document.getElementById("root")!).render(
  <TelegramProvider>
    <App />
  </TelegramProvider>
);
