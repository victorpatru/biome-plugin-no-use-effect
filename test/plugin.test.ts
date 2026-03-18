import assert from "node:assert";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type BiomeErrorOutput = null | {
  summary: {
    changed: number;
    unchanged: number;
    matches: number;
    duration: { secs: number; nanos: number };
    scannerDuration: { secs: number; nanos: number };
    errors: number;
    warnings: number;
    infos: number;
    skipped: number;
    suggestedFixesSkipped: number;
    diagnosticsNotPrinted: number;
  };
  diagnostics: [
    {
      category: string;
      severity: "debug" | "info" | "warning" | "error";
      description: string;
      message: [
        {
          elements: Array<unknown>;
          content: string;
        },
      ];
      advices: { advices: Array<unknown> };
      verboseAdvices: { advices: Array<unknown> };
      location: {
        path: { file: string };
        span: [number, number];
        sourceCode: string;
      };
      tags: [];
      source: null;
    },
  ];
  command: string;
};

function isBiomeSpawnError(
  error: unknown,
): error is Error & { output: Array<unknown> } {
  return (
    error instanceof Error &&
    "output" in error &&
    Array.isArray((error as Record<string, unknown>).output)
  );
}

function execBiome(fixtureFile: "01" | "02"): BiomeErrorOutput | null {
  const fixturePath = join(__dirname, "fixtures", `${fixtureFile}.ts`);
  const biomeConfigPath = "./test/biome.config.jsonc";

  try {
    execSync(
      `npx @biomejs/biome check --config-path=${biomeConfigPath} --reporter=json ${fixturePath}`,
      { encoding: "utf-8", stdio: "pipe" },
    );
    return null;
  } catch (error: unknown) {
    if (!isBiomeSpawnError(error)) return null;
    const validOutputs = getValidOutputs(error.output);
    return validOutputs[0] ?? null;
  }
}

function getValidOutputs(biomeOutput: Array<unknown>) {
  const validOutputs: BiomeErrorOutput[] = biomeOutput
    .map((o: unknown) => {
      if (o === null || typeof o !== "string") return null;
      try {
        return JSON.parse(o);
      } catch (_e) {
        return null;
      }
    })
    .filter(Boolean);
  return validOutputs;
}

describe("no-use-effect plugin", () => {
  it("detects direct useEffect() calls", () => {
    const output = execBiome("01");
    assert(output !== null, "Expected biome to report an error for direct useEffect call");

    const pluginError = output.diagnostics.find(
      (diag) => diag.category === "plugin",
    );
    assert(pluginError !== undefined, "Expected a plugin-category diagnostic");

    expect(pluginError.description).toContain(
      "Direct useEffect() calls are not allowed.",
    );
    expect(pluginError.location.sourceCode).toContain("useEffect");
  });

  it("allows useEffect suppressed with biome-ignore (useMountEffect pattern)", () => {
    const output = execBiome("02");

    const pluginError = output?.diagnostics.find(
      (diag) => diag.category === "plugin",
    );

    expect(pluginError).toBeUndefined();
  });
});
