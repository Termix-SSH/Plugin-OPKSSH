import { randomBytes } from "node:crypto";
import { renderResultPage } from "./result-page.js";

// Replicates openpubkey's client/choosers/web_chooser.go IssuerToName().
// OPKSSH's /select handler keys its providerMap by this derived name, NOT by the
// `alias` field in config.yml. We need the same mapping so we can normalize any
// `op=` query param we receive (which can be alias, issuer with protocol, or
// issuer without protocol depending on client version) to what OPKSSH expects.
function opksshIssuerToName(issuer: string): string | null {
  if (!issuer) return null;
  const withScheme =
    issuer.startsWith("http://") || issuer.startsWith("https://")
      ? issuer
      : `https://${issuer}`;
  if (withScheme.startsWith("https://accounts.google.com")) return "google";
  if (withScheme.startsWith("https://login.microsoftonline.com"))
    return "azure";
  if (withScheme.startsWith("https://gitlab.com")) return "gitlab";
  if (withScheme.startsWith("https://issuer.hello.coop")) return "hello";
  if (withScheme.startsWith("https://")) {
    const host = withScheme.slice("https://".length).split("/")[0];
    return host || null;
  }
  return null;
}

export function normalizeSelectOpParam(
  rawOp: string,
  providers: Array<{ alias: string; issuer: string }>,
): string {
  if (!rawOp) return rawOp;
  const knownNames = new Set(
    providers
      .map((p) => opksshIssuerToName(p.issuer))
      .filter((n): n is string => typeof n === "string" && n.length > 0),
  );
  if (knownNames.has(rawOp)) return rawOp;

  const derivedFromRaw = opksshIssuerToName(rawOp);
  if (derivedFromRaw && knownNames.has(derivedFromRaw)) return derivedFromRaw;

  const matchByAlias = providers.find((p) => p.alias === rawOp);
  if (matchByAlias) {
    const name = opksshIssuerToName(matchByAlias.issuer);
    if (name) return name;
  }

  return rawOp;
}

type OpksshErrorPageOptions = {
  title: string;
  heading: string;
  message: string;
  details?: string;
  requestId?: string;
  statusCode?: number;
};

/** A failed sign-in, in the same look as the success page. */
export function renderErrorPage(opts: OpksshErrorPageOptions): string {
  const detail = [opts.message, opts.details].filter(Boolean).join("\n\n");
  return renderResultPage(
    { ok: false, detail, requestId: opts.requestId },
    randomBytes(16).toString("base64"),
  );
}

/**
 * Points every URL in a page OPKSSH served at its proxied path, so the
 * browser keeps talking to Termix instead of this server's localhost.
 * `basePath` is the proxied prefix, e.g. "/plugin-api/opkssh/chooser/<id>".
 */
export function rewriteOpksshHtml(html: string, basePath: string): string {
  const localHostPattern = "(?:localhost|127\\.0\\.0\\.1)";
  const attrPatterns = ["action", "href", "src", "formaction"];
  for (const attr of attrPatterns) {
    html = html.replace(
      new RegExp(`${attr}="(/[^"]*)`, "g"),
      `${attr}="${basePath}$1`,
    );
    html = html.replace(
      new RegExp(`${attr}='(/[^']*)`, "g"),
      `${attr}='${basePath}$1`,
    );
  }

  for (const attr of ["href", "action", "src", "formaction"]) {
    html = html.replace(
      new RegExp(
        `${attr}=["']?http:\\/\\/${localHostPattern}:\\d+\\/([^"'\\s]*)`,
        "g",
      ),
      `${attr}="${basePath}/$1`,
    );
  }

  html = html.replace(
    new RegExp(
      `(window\\.location\\.href\\s*=\\s*["'])http:\\/\\/${localHostPattern}:\\d+\\/([^"']*)(["'])`,
      "g",
    ),
    `$1${basePath}/$2$3`,
  );
  html = html.replace(
    new RegExp(
      `(window\\.location\\s*=\\s*["'])http:\\/\\/${localHostPattern}:\\d+\\/([^"']*)(["'])`,
      "g",
    ),
    `$1${basePath}/$2$3`,
  );
  html = html.replace(
    new RegExp(
      `(fetch\\(["'])http:\\/\\/${localHostPattern}:\\d+\\/([^"']*)(["'])`,
      "g",
    ),
    `$1${basePath}/$2$3`,
  );

  html = html.replace(
    new RegExp(
      `(location\\.assign\\(["'])http:\\/\\/${localHostPattern}:\\d+\\/([^"']*)(["']\\))`,
      "g",
    ),
    `$1${basePath}/$2$3`,
  );
  html = html.replace(
    new RegExp(
      `(location\\.replace\\(["'])http:\\/\\/${localHostPattern}:\\d+\\/([^"']*)(["']\\))`,
      "g",
    ),
    `$1${basePath}/$2$3`,
  );

  // XMLHttpRequest.open("GET", "http://localhost:PORT/path", ...)
  html = html.replace(
    new RegExp(
      `(\\.open\\(["']\\w+["']\\s*,\\s*["'])http:\\/\\/${localHostPattern}:\\d+\\/([^"']*)(["'])`,
      "g",
    ),
    `$1${basePath}/$2$3`,
  );

  html = html.replace(
    new RegExp(
      `(<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^;]+;\\s*url=)http:\\/\\/${localHostPattern}:\\d+\\/([^"']+)(["'][^>]*>)`,
      "gi",
    ),
    `$1${basePath}/$2$3`,
  );

  html = html.replace(
    new RegExp(
      `(data-[\\w-]+=["'])http:\\/\\/${localHostPattern}:\\d+\\/([^"']*)(["'])`,
      "g",
    ),
    `$1${basePath}/$2$3`,
  );

  const baseTag = `<base href="${basePath}/">`;

  if (html.includes("<base")) {
    html = html.replace(/<base[^>]*>/i, baseTag);
  } else if (html.includes("<head>")) {
    html = html.replace(/<head>/i, `<head>${baseTag}`);
  } else {
    html = `<!DOCTYPE html><html><head>${baseTag}</head><body>${html}</body></html>`;
  }

  return html;
}
