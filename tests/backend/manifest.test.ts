import { describe, expect, it } from "vitest";
import { validateManifest } from "@termix/plugin-sdk/manifest";
import manifest from "../../manifest.json";

describe("manifest", () => {
  it("validates", () => {
    expect(validateManifest(manifest)).toEqual([]);
  });

  it("has no 2.8 redirects left", () => {
    expect(
      (manifest.contributes as { http?: { legacyRedirects?: unknown } }).http
        ?.legacyRedirects,
    ).toBeUndefined();
  });
});
