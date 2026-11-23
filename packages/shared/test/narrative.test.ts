import { describe, expect, it } from "vitest";
import { calculateProjectionPair, createMockLogs, createTemplateNarrative, simulationNarrativeSchema } from "../src/index.js";

describe("createTemplateNarrative", () => {
  it("produces a valid narrative from deterministic projections", () => {
    const logs = createMockLogs();
    const narrative = createTemplateNarrative(logs, calculateProjectionPair(logs));
    expect(simulationNarrativeSchema.parse(narrative)).toEqual(narrative);
    expect(narrative.user).toMatch(/day 30/);
  });
});
