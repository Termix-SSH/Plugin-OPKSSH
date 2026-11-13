import { describe, expect, it } from "vitest";
import { COOKIE_PREFIX, upstreamCookies } from "../../src/backend/routes.js";

describe("cookies passed to the OPKSSH listener", () => {
  it("uses the prefix Termix lets a plugin own", () => {
    expect(COOKIE_PREFIX).toBe("tmxp_opkssh_");
  });

  it("sends OPKSSH's own cookies back under their real names only", () => {
    expect(
      upstreamCookies(
        "jwt=secret; tmxp_opkssh_state=abc; tmxp_opkssh_request_id=r1; tmxp_opkssh_nonce=n",
      ),
    ).toBe("state=abc; nonce=n");
    expect(upstreamCookies("jwt=secret")).toBeUndefined();
    expect(upstreamCookies(undefined)).toBeUndefined();
  });
});
