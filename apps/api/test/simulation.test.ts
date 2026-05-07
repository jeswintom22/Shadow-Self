import { createMockLogs, type HabitLog, type SimulationVerdict } from "@shadow-self/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../src/app.js";
import { SimulationProviderError, SimulationSetupError, type SimulationService } from "../src/services/simulationService.js";

function createProjection() {
  return Array.from({ length: 30 }, (_, index) => ({
    day: index + 1,
    energy: 70,
    focus: 68,
    mood: 72
  }));
}

function createVerdict(logs: HabitLog[]): SimulationVerdict {
  return {
    user: createProjection(),
    shadow: createProjection(),
    narrative: {
      user: "Your projection is steady but strained.",
      shadow: "The Shadow gains consistency from the inverted habits.",
      comparison: "The divergence is driven by sleep, screen time, and exercise."
    },
    generatedAt: "2026-05-07T00:00:00.000Z",
    lastInputDate: logs.at(-1)?.date ?? "2026-05-07"
  };
}

async function withApp(service: SimulationService) {
  const app = await buildApp({ logger: false, simulationService: service });

  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/simulation/run", () => {
  it("rejects invalid request bodies", async () => {
    const app = await withApp({ run: vi.fn() });
    const response = await app.inject({
      method: "POST",
      url: "/api/simulation/run",
      payload: { logs: [{ date: "nope" }] }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("Invalid simulation request");
    await app.close();
  });

  it("rejects fewer than seven logs", async () => {
    const app = await withApp({ run: vi.fn() });
    const response = await app.inject({
      method: "POST",
      url: "/api/simulation/run",
      payload: { logs: createMockLogs().slice(0, 6) }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("Seven logged days are required to run a simulation.");
    await app.close();
  });

  it("returns 503 when Claude credentials are missing", async () => {
    const app = await withApp({
      async run() {
        throw new SimulationSetupError("ANTHROPIC_API_KEY and ANTHROPIC_MODEL are required to run simulations.");
      }
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/simulation/run",
      payload: { logs: createMockLogs() }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error).toContain("ANTHROPIC_API_KEY");
    await app.close();
  });

  it("returns a combined simulation verdict", async () => {
    const service: SimulationService = {
      run: vi.fn(async (logs) => createVerdict(logs))
    };
    const logs = createMockLogs(new Date("2026-05-07T12:00:00"));
    const app = await withApp(service);
    const response = await app.inject({
      method: "POST",
      url: "/api/simulation/run",
      payload: { logs }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user).toHaveLength(30);
    expect(response.json().shadow).toHaveLength(30);
    expect(response.json().lastInputDate).toBe("2026-05-07");
    expect(service.run).toHaveBeenCalledOnce();
    await app.close();
  });

  it("returns a retryable 502 for malformed provider output", async () => {
    const app = await withApp({
      async run() {
        throw new SimulationProviderError("Claude returned invalid projection JSON.");
      }
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/simulation/run",
      payload: { logs: createMockLogs() }
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: "Claude returned invalid projection JSON.",
      retryable: true
    });
    await app.close();
  });
});
