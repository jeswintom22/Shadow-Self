import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { hasCompletedOnboarding } from "./lib/onboarding.js";
import { Dashboard } from "./routes/Dashboard.js";
import { LogHabits } from "./routes/LogHabits.js";
import { Onboarding } from "./routes/Onboarding.js";
import { Settings } from "./routes/Settings.js";
import { Simulation } from "./routes/Simulation.js";

export function App() {
  const [isOnboarded, setIsOnboarded] = useState(hasCompletedOnboarding);

  return (
    <BrowserRouter>
      {isOnboarded ? (
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/log" replace />} />
            <Route path="/log" element={<LogHabits />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/log" replace />} />
          </Route>
        </Routes>
      ) : (
        <Routes>
          <Route path="*" element={<Onboarding onComplete={() => setIsOnboarded(true)} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
