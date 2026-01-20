import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { AuthProvider } from "./modules/shared/context/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { setupGlobalErrorHandlers } from "./utils/errorHandler.js";

// Setup global error handlers to suppress browser extension errors
setupGlobalErrorHandlers();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>
);
