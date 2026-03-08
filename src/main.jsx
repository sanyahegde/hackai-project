import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App_FULL.jsx";
import { PERSONAS, seedPersona } from "./components/PersonaLogin.jsx";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, background: "#09090b", color: "#e4e4e7", minHeight: "100vh", fontFamily: "system-ui,sans-serif" }}>
          <h1 style={{ color: "#f87171" }}>Something went wrong</h1>
          <pre style={{ overflow: "auto", fontSize: 12 }}>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [persona, setPersona] = useState(() => {
    const saved = localStorage.getItem("learnflow_persona");
    if (saved) return JSON.parse(saved);
    return PERSONAS[0];
  });

  const [switchKey, setSwitchKey] = useState(0);

  const handleSwitch = useCallback(async (p) => {
    await seedPersona(p);
    setPersona(p);
    setSwitchKey((k) => k + 1);
  }, []);

  // Seed on first load
  React.useEffect(() => {
    seedPersona(persona);
  }, []);

  return (
    <App
      key={switchKey}
      persona={persona}
      allPersonas={PERSONAS}
      onSwitchPersona={handleSwitch}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
