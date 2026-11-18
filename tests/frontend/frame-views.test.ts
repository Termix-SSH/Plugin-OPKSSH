import { describe, expect, it } from "vitest";
import { checkFrameViews } from "@termix-ssh/plugin-sdk/testing";
import * as plugin from "../../src/frontend/index";
import manifest from "../../manifest.json";

const host = {
  id: 1,
  name: "Test host",
  ip: "192.0.2.10",
  port: 22,
  username: "test",
  folder: "",
  tags: [],
  pluginSettings: {},
};

describe("sandboxed frame views", () => {
  it("asks core only for what a frame may reach", async () => {
    const { refused } = await checkFrameViews(plugin, {
      manifest: manifest as unknown as Record<string, unknown>,
      hosts: [host],
    });
    expect(refused).toEqual([]);
  });
});
