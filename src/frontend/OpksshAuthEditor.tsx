import { useTranslation } from "@termix-ssh/plugin-sdk/frontend";
import { docsUrl } from "./docs";

const DOCS_URL = docsUrl();

/** The host editor's "opkssh" auth method: nothing to fill in, just a pointer. */
export function OpksshAuthEditor() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t("editor.label")}
        </span>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-accent-brand hover:underline"
        >
          {t("editor.docs")}
        </a>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {t("editor.description")}
      </p>
    </div>
  );
}
