import { describe, expect, it } from "vitest";
import * as plugin from "../../src/frontend/index";

type When = (context: Record<string, unknown>) => boolean;

function overlayWhen(): When {
  let when: When | undefined;
  const app = new Proxy(
    {},
    {
      get: (_target, name) =>
        name === "registerSlotContribution"
          ? (
              slotId: string,
              contribution: { actionId: string; when?: When },
            ) => {
              if (
                slotId === "terminal.overlay" &&
                contribution.actionId === "opkssh.signIn"
              ) {
                when = contribution.when;
              }
              return () => {};
            }
          : () => () => {},
    },
  );
  plugin.activate(app as never);
  if (!when) throw new Error("no overlay when");
  return when;
}

describe("terminal overlay", () => {
  it("mounts only for hosts that use it or go through a jump host", () => {
    const when = overlayWhen();
    expect(when({ host: { authType: "opkssh" } })).toBe(true);
    expect(
      when({ host: { authType: "key", jumpHosts: [{ hostId: 2 }] } }),
    ).toBe(true);
    expect(when({ host: { authType: "password", jumpHosts: [] } })).toBe(false);
    expect(when({})).toBe(false);
  });
});
