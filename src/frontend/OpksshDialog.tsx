import { Shield, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import {
  PanePrompt,
  PROMPT_BUTTON,
  PROMPT_PRIMARY_BUTTON,
} from "@termix-ssh/plugin-sdk/ui";

export type SignInStage =
  "chooser" | "waiting" | "authenticating" | "completed" | "error";

interface OpksshDialogProps {
  authUrl: string;
  stage: SignInStage;
  error?: string;
  providers?: Array<{ alias: string; issuer: string }>;
  onCancel: () => void;
  onOpenUrl: () => void;
  onSelectProvider?: (alias: string) => void;
  backgroundColor?: string;
}

/** The browser sign-in the terminal shows while OPKSSH waits. */
export function OpksshDialog({
  authUrl,
  stage,
  error,
  providers,
  onCancel,
  onOpenUrl,
  onSelectProvider,
  backgroundColor,
}: OpksshDialogProps) {
  const { t } = useTranslation();
  const showError = stage === "error" && !!error;
  const canCancel =
    stage === "chooser" || stage === "waiting" || stage === "authenticating";

  return (
    <PanePrompt
      open
      layer="connection"
      backgroundColor={backgroundColor}
      icon={<Shield className="size-4" />}
      title={t("dialog.title")}
      description={stage === "chooser" ? t("dialog.description") : undefined}
      className="max-w-md"
      actions={
        canCancel || showError ? (
          <button type="button" onClick={onCancel} className={PROMPT_BUTTON}>
            {showError ? t("common.close") : t("common.cancel")}
          </button>
        ) : undefined
      }
    >
      {stage === "chooser" &&
        (providers && providers.length > 0 && onSelectProvider ? (
          <div className="flex flex-col gap-2">
            {providers.map((provider) => (
              <button
                key={provider.alias}
                type="button"
                onClick={() => onSelectProvider(provider.alias)}
                className={`${PROMPT_PRIMARY_BUTTON} w-full`}
              >
                <ExternalLink className="size-3.5" />
                {t("dialog.signInWith", {
                  provider:
                    provider.alias.charAt(0).toUpperCase() +
                    provider.alias.slice(1),
                })}
              </button>
            ))}
          </div>
        ) : authUrl ? (
          <button
            type="button"
            onClick={onOpenUrl}
            className={`${PROMPT_PRIMARY_BUTTON} w-full`}
          >
            <ExternalLink className="size-3.5" />
            {t("dialog.openBrowser")}
          </button>
        ) : null)}

      {(stage === "waiting" || stage === "authenticating") && (
        <div className="flex items-center gap-3 py-1">
          <Loader2 className="size-4 animate-spin text-accent-brand shrink-0" />
          <p className="text-xs text-muted-foreground">
            {stage === "waiting"
              ? t("dialog.waiting")
              : t("dialog.authenticating")}
          </p>
        </div>
      )}

      {showError && (
        <div className="flex items-start gap-3 p-3 border border-destructive/20 bg-destructive/10">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">
              {t("common.error")}
            </p>
            <p className="text-xs text-destructive/90 mt-1 whitespace-pre-wrap break-words">
              {error}
            </p>
          </div>
        </div>
      )}
    </PanePrompt>
  );
}
