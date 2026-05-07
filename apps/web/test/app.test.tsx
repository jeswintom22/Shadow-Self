import { createMockLogs, type SimulationVerdict } from "@shadow-self/shared";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/App.js";
import { ONBOARDING_STORAGE_KEY } from "../src/lib/onboarding.js";
import { useHabitStore } from "../src/store/habitStore.js";

function createVerdict(lastInputDate = "2026-05-07"): SimulationVerdict {
  const projection = Array.from({ length: 30 }, (_, index) => ({
    day: index + 1,
    energy: 82,
    focus: 77,
    mood: 79
  }));

  return {
    user: projection,
    shadow: projection,
    narrative: {
      user: "Your projection stays level.",
      shadow: "The Shadow projection improves.",
      comparison: "Sleep and screen time create the gap."
    },
    generatedAt: "2026-05-07T00:00:00.000Z",
    lastInputDate
  };
}

function resetAppState(path = "/") {
  useHabitStore.getState().reset();
  window.localStorage.clear();
  window.history.pushState({}, "", path);
}

beforeEach(() => {
  resetAppState();
});

afterEach(() => {
  cleanup();
});

describe("App flows", () => {
  it("shows onboarding first and enters the log page", async () => {
    render(<App />);

    expect(screen.getByRole("button", { name: /meet your shadow/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /meet your shadow/i }));

    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
    expect(screen.getByRole("button", { name: /log my day/i })).toBeInTheDocument();
  });

  it("logs a day and navigates to the dashboard", async () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    window.history.pushState({}, "", "/log");

    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /log my day/i }));

    expect(await screen.findByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/6 more days until your shadow fully diverges/i)).toBeInTheDocument();
  });

  it("shows the partial dashboard before seven logs", () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    window.history.pushState({}, "", "/dashboard");
    useHabitStore.getState().submitToday("2026-05-07");

    render(<App />);

    expect(screen.getByText(/6 more days until your shadow fully diverges/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /energy/i })).toBeInTheDocument();
  });

  it("shows the development sample-data control", () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    window.history.pushState({}, "", "/log");

    render(<App />);

    expect(screen.getByRole("button", { name: /load sample data/i })).toBeInTheDocument();
  });

  it("enables simulation with seven logs and disables it when the verdict is current", () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    window.history.pushState({}, "", "/simulation");
    const logs = createMockLogs(new Date("2026-05-07T12:00:00"));
    useHabitStore.setState({ logs: Object.fromEntries(logs.map((log) => [log.date, log])) });

    const { rerender } = render(<App />);

    expect(screen.getByRole("button", { name: /run 30-day simulation/i })).toBeEnabled();

    useHabitStore.getState().setVerdict(createVerdict("2026-05-07"));
    rerender(<App />);

    expect(screen.getByRole("button", { name: /simulation current/i })).toBeDisabled();
  });
});
