import { describe, expect, it } from "vitest";
import { renderResultPage } from "../../src/backend/result-page.js";

describe("result page", () => {
  it("shows a signed in page that closes itself", () => {
    const html = renderResultPage({ ok: true }, "n1");
    expect(html).toContain("Signed in");
    expect(html).toContain('"ok":true');
    expect(html).toContain('nonce="n1"');
  });

  it("escapes the error detail and shows the request id", () => {
    const html = renderResultPage(
      { ok: false, detail: "<b>bad</b>", requestId: "r-1" },
      "n2",
    );
    expect(html).toContain("Sign in failed");
    expect(html).toContain("&lt;b&gt;bad&lt;/b&gt;");
    expect(html).not.toContain("<b>bad</b>");
    expect(html).toContain("Request ID: r-1");
  });

  it("keeps boot data from closing its script tag", () => {
    const html = renderResultPage(
      { ok: false, requestId: "</script><script>x" },
      "n3",
    );
    expect(html).not.toContain("</script><script>x");
  });
});
