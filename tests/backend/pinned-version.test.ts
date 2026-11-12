import { describe, expect, it } from "vitest";
import { binarySpec, DEFAULT_VERSION } from "../../src/backend/binary.js";

function parts(version: string): number[] {
  return version.replace(/^v/, "").split(".").map(Number);
}

describe("pinned opkssh release", () => {
  it("is at least 0.19.2, which has the Go library security fixes", () => {
    const [major, minor, patch] = parts(DEFAULT_VERSION);
    expect(major * 1e6 + minor * 1e3 + patch).toBeGreaterThanOrEqual(19002);
  });

  it.each([
    ["linux", "x64"],
    ["linux", "arm64"],
    ["darwin", "x64"],
    ["darwin", "arm64"],
    ["win32", "x64"],
    ["win32", "arm64"],
  ])("has its own checksum for %s %s", (platform, arch) => {
    const spec = binarySpec({}, platform, arch, "/app");
    expect(spec.version).toBe(DEFAULT_VERSION);
    expect(spec.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(spec.url).toContain(`/download/${DEFAULT_VERSION}/`);
  });
});
