import type { ComponentType } from "react";
import type { TermixApp } from "@termix-ssh/plugin-sdk/frontend";
import { OpksshAuthEditor } from "./OpksshAuthEditor";
import { OpksshOverlay } from "./OpksshOverlay";
import { RedirectUriSetting } from "./RedirectUriSetting";

/** Only hosts that use this auth, or reach it through a jump host, need it. */
function needsSignIn(context: Record<string, unknown>, authType: string) {
  const host = context.host as
    { authType?: string; jumpHosts?: unknown[] } | undefined;
  return host?.authType === authType || (host?.jumpHosts?.length ?? 0) > 0;
}

export function activate(app: TermixApp): void {
  app.registerSshAuthEditor({
    authType: "opkssh",
    titleKey: "hosts.filterAuthOpkssh",
    component: OpksshAuthEditor,
  });

  // The browser sign-in while a terminal connects to an OPKSSH host.
  app.registerSlotContribution("terminal.overlay", {
    actionId: "opkssh.signIn",
    when: (context) => needsSignIn(context, "opkssh"),
    titleKey: "dialog.title",
    kind: "component",
    component: OpksshOverlay as unknown as ComponentType<
      Record<string, unknown>
    >,
  });

  app.registerSettingsComponent("redirectUri", RedirectUriSetting);
}
