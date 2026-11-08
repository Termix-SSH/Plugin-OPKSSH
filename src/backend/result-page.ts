import { randomBytes } from "node:crypto";
import type { Response } from "express";
import en from "../../locales/en.json";

/**
 * The page the sign-in popup lands on. It has no app shell, so it copies the
 * look of core's Auth screen. Step CA, OPKSSH and Vault carry the same file;
 * keep them in step.
 */

const PLUGIN_ID = "opkssh";

// Same names as locales/translated. i18nextLng holds the short code.
const LANGUAGE_FILES =
  "af_ZA ar_SA bn_BD bg_BG ca_ES zh_CN zh_TW hr_HR cs_CZ da_DK nl_NL et_EE fi_FI fr_FR de_DE el_GR he_IL hi_IN hu_HU id_ID it_IT ja_JP ko_KR lv_LV lt_LT ms_MY no_NO pl_PL pt_PT pt_BR ro_RO ru_RU sr_SP sk_SK sl_SI es_ES sv_SE th_TH tr_TR uk_UA vi_VN";

const STYLES = `
:root{--accent-brand:#f59145;--background:oklch(1 0 0);--foreground:oklch(.1802 .0043 128.73);--card:oklch(1 0 0);--muted-foreground:oklch(.44 0 0);--destructive:oklch(.577 .245 27.325);--border:oklch(.922 0 0);--input:oklch(.922 0 0);--ring:oklch(.708 0 0)}
.dark{--background:oklch(.155 .004 128.73);--foreground:oklch(.985 0 0);--card:oklch(.21 .004 128.68);--muted-foreground:oklch(.72 0 0);--destructive:oklch(.704 .191 22.216);--border:oklch(1 0 0/12%);--input:oklch(1 0 0/15%);--ring:oklch(.556 0 0)}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
html{font-size:14px}
html.fs-xs{font-size:12px}
html.fs-sm{font-size:13px}
html.fs-lg{font-size:17px}
html.fs-xl{font-size:20px}
body{display:flex;align-items:center;justify-content:center;padding:1.5rem;background:var(--background);color:var(--foreground);font-family:var(--font-ui,"JetBrains Mono Variable","JetBrains Mono"),ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:1rem;line-height:1.5}
h1,p{margin:0}
[hidden]{display:none!important}
.card{width:100%;max-width:380px;display:flex;flex-direction:column;gap:1.25rem;border:1px solid var(--border);background:var(--card);padding:1.25rem}
.brand{display:flex;align-items:center;gap:0.625rem}
.brand img{width:1.75rem;height:1.75rem;object-fit:contain}
.brand span{font-size:0.875rem;font-weight:700;text-transform:uppercase;letter-spacing:.3em}
.head{display:flex;align-items:center;gap:0.625rem}
.head h1{font-size:1.25rem;font-weight:700;line-height:1.4}
.mark{display:flex;color:var(--accent-brand)}
.fail .mark{color:var(--destructive)}
svg{width:1.25rem;height:1.25rem;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.note{font-size:0.75rem;color:var(--muted-foreground);overflow-wrap:anywhere}
.error{padding:0.5rem 0.625rem;border:1px solid color-mix(in oklch,var(--destructive) 40%,transparent);background:color-mix(in oklch,var(--destructive) 10%,transparent);font-size:0.75rem;color:var(--destructive);white-space:pre-wrap;overflow-wrap:anywhere}
.id{font-size:10px;color:var(--muted-foreground);overflow-wrap:anywhere}
.btn{display:inline-flex;align-items:center;justify-content:center;width:100%;height:2.5rem;padding:0 0.625rem;border:1px solid var(--input);border-radius:0;background:color-mix(in oklch,var(--input) 30%,transparent);color:var(--foreground);font:inherit;font-size:0.75rem;font-weight:700;cursor:pointer;transition:background-color .15s}
.btn:hover{background:color-mix(in oklch,var(--input) 50%,transparent)}
.btn:focus-visible{outline:1px solid var(--ring)}
`;

// Runs before anything paints, so the page never flashes the wrong theme.
const THEME_SCRIPT = `
(function(){
var root=document.documentElement,theme=null,cached=null,size=null;
try{size=localStorage.getItem("termix-font-size");theme=localStorage.getItem("vite-ui-theme");cached=JSON.parse(localStorage.getItem("termix-theme-css")||"null");}catch(e){}
if(!theme)theme="dark";
if(theme==="system")theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
root.classList.add(theme);
if(size)root.classList.add("fs-"+size);
if(cached&&cached.id===theme&&typeof cached.href==="string"){
var link=document.createElement("link");link.rel="stylesheet";link.href=cached.href;document.head.appendChild(link);
}
})();
`;

const CLIENT_SCRIPT = `
(function(){
var boot=window.RESULT_BOOT;
var root=location.pathname.split("/plugin-api/")[0];
function apply(strings){
document.querySelectorAll("[data-t]").forEach(function(el){
var text=strings[el.getAttribute("data-t")];
if(typeof text==="string")el.textContent=text.split("{{id}}").join(boot.requestId||"");
});
}
document.getElementById("close").addEventListener("click",function(){window.close();});
var logo=document.getElementById("brand-logo");
logo.addEventListener("load",function(){logo.hidden=false;});
logo.addEventListener("error",function(){logo.hidden=true;});
logo.src=root+"/icon.svg";
var saved=null;
try{saved=localStorage.getItem("i18nextLng");}catch(e){}
if(saved&&saved!=="en"){
var short=saved.split("-")[0];
var file=boot.languages.filter(function(name){return name===saved.replace("-","_");})[0]||
boot.languages.filter(function(name){return name.split("_")[0]===short;})[0];
if(file)fetch(root+"/plugin-assets/"+boot.pluginId+"/locales/translated/"+file+".json").then(function(r){return r.ok?r.json():null;}).then(function(data){
if(data&&data.resultPage)apply(data.resultPage);
document.documentElement.lang=short;
}).catch(function(){});
}
fetch(root+"/users/branding",{credentials:"include"}).then(function(r){return r.ok?r.json():null;}).then(function(brand){
if(!brand)return;
var name=brand.appName||"Termix";
document.title=name;
document.getElementById("brand-name").textContent=name;
if(brand.logo)logo.src=brand.logo;
}).catch(function(){});
if(boot.ok)setTimeout(function(){window.close();},2000);
})();
`;

const ICON_OK = '<path d="M20 6 9 17l-5-5"/>';
const ICON_FAIL =
  '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Inline JSON that can't close the script tag it sits in. */
function json(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export interface ResultPageOptions {
  ok: boolean;
  /** Shown under the heading when the sign-in failed. */
  detail?: string;
  requestId?: string;
}

const strings = en.resultPage;

export function renderResultPage(
  options: ResultPageOptions,
  nonce: string,
): string {
  const { ok, detail, requestId } = options;
  const boot = {
    ok,
    requestId: requestId ?? "",
    pluginId: PLUGIN_ID,
    languages: LANGUAGE_FILES.split(" "),
  };
  const heading = ok ? "signedIn" : "failed";
  const note = ok ? "closing" : "tryAgain";
  const error =
    !ok && detail ? `<p class="error">${escapeHtml(detail)}</p>` : "";
  const id = requestId
    ? `<p class="id" data-t="requestId">${escapeHtml(strings.requestId.split("{{id}}").join(requestId))}</p>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Termix</title>
<style nonce="${nonce}">${STYLES}</style>
<script nonce="${nonce}">${THEME_SCRIPT}</script>
</head><body>
<main class="card${ok ? "" : " fail"}">
<div class="brand"><img id="brand-logo" alt="" hidden><span id="brand-name">Termix</span></div>
<div class="head"><span class="mark"><svg viewBox="0 0 24 24" aria-hidden="true">${ok ? ICON_OK : ICON_FAIL}</svg></span><h1 data-t="${heading}">${escapeHtml(strings[heading])}</h1></div>
<p class="note" data-t="${note}">${escapeHtml(strings[note])}</p>
${error}${id}
<button class="btn" id="close" type="button" data-t="close">${escapeHtml(strings.close)}</button>
</main>
<script nonce="${nonce}">window.RESULT_BOOT=${json(boot)};</script>
<script nonce="${nonce}">${CLIENT_SCRIPT}</script>
</body></html>`;
}

const csp = (nonce: string) =>
  `default-src 'none'; style-src 'self' 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;

/** Sends the result page with its own CSP. */
export function sendResultPage(
  res: Response,
  status: number,
  options: ResultPageOptions,
): void {
  const nonce = randomBytes(16).toString("base64");
  res
    .status(status)
    .setHeader("Content-Security-Policy", csp(nonce))
    .type("html")
    .send(renderResultPage(options, nonce));
}
