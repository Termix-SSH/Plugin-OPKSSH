import { pluginDocsPage } from "@termix-ssh/plugin-sdk/docs";
import manifest from "../../manifest.json";

/** A page of this plugin's docs, from the docs link in its manifest. */
export function docsUrl(page?: string, anchor?: string): string {
  return pluginDocsPage(manifest.docs, page, anchor);
}
