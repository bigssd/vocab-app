import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { startVoiceLoad } from "./services/speech";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

startVoiceLoad();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
