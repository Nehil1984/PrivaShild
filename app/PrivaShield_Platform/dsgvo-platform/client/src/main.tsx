import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Unbekannter Fehler" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("PrivaShield UI crash", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm space-y-3">
            <h1 className="text-lg font-semibold">Die Weboberfläche wurde unerwartet unterbrochen</h1>
            <p className="text-sm text-muted-foreground">Die Anwendung ist nicht komplett weg, aber ein Frontend-Fehler hat die Ansicht gestoppt. Du kannst die Seite neu laden.</p>
            <p className="text-xs text-muted-foreground">Fehler: {this.state.message}</p>
            <button className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => window.location.reload()}>
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

if (!window.location.hash) {
  window.location.hash = "#/";
}

window.addEventListener("error", (event) => {
  console.error("window.error", event.error || event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("window.unhandledrejection", event.reason);
});

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
