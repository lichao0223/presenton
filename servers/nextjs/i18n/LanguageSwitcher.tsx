"use client";

import { Languages } from "lucide-react";
import { useI18n } from "./I18nProvider";
import { Locale, localeLabels } from "./translations";

const nextLocale: Record<Locale, Locale> = {
  en: "zh-CN",
  "zh-CN": "en",
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const targetLocale = nextLocale[locale];

  return (
    <button
      type="button"
      className={
        compact
          ? "mx-auto flex flex-col items-center gap-2 text-slate-800 transition-colors hover:text-[#5146E5]"
          : "inline-flex items-center gap-2 rounded-full border border-[#E1E1E5] bg-white px-3 py-2 text-xs font-medium text-[#333333] transition-colors hover:border-[#7A5AF8] hover:text-[#5146E5]"
      }
      aria-label={`Switch UI language to ${localeLabels[targetLocale]}`}
      title={`Switch UI language to ${localeLabels[targetLocale]}`}
      onClick={() => setLocale(targetLocale)}
      data-i18n-skip
    >
      <Languages className={compact ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden="true" />
      <span className={compact ? "text-[11px]" : ""}>
        {targetLocale === "zh-CN" ? "中文" : "EN"}
      </span>
    </button>
  );
}
