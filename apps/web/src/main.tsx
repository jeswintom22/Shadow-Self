import { AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import { Splash } from "./components/Splash.js";
import { initTheme } from "./lib/theme.js";
import "./index.css";

initTheme();

const SPLASH_MIN_MS = 1400;

function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), SPLASH_MIN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <App />
      <AnimatePresence>{ready ? null : <Splash />}</AnimatePresence>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
