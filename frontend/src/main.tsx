// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { I18nProvider } from "./i18n";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
  <I18nProvider>
    <App />
  </I18nProvider>
    
  </BrowserRouter>
);
