/**
 * useLocale.js
 *
 * Reads the /:lang URL prefix and returns:
 *   - `locale`  → "en" | "nl"
 *   - `t(key)`  → translated string, e.g. t("home.title")
 *   - `tp(key, vars)` → translated string with {{variable}} interpolation
 *
 * Place this file at:  src/hooks/useLocale.js
 *
 * Usage inside any page/component:
 *   import { useLocale } from "../hooks/useLocale";
 *   const { locale, t } = useLocale();
 */

import { useParams } from "react-router-dom";
import translations, { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../data/i18n";

// ── Core resolver ─────────────────────────────────────────────────────────────

/**
 * Resolve a dot-separated key against a translations object.
 * Returns the value or the key itself as fallback.
 */
function resolve(obj, key) {
  const value = key.split(".").reduce((acc, part) => acc?.[part], obj);
  return value !== undefined ? value : key;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLocale() {
  const { lang } = useParams();
  const locale = SUPPORTED_LOCALES.includes(lang) ? lang : DEFAULT_LOCALE;
  const dict = translations[locale] ?? translations[DEFAULT_LOCALE];

  /**
   * t("home.title")
   * → "Building Ecosystems"  (en)
   * → "Ecosystemen Bouwen"   (nl)
   */
  function t(key) {
    return resolve(dict, key);
  }

  /**
   * tp("confirm.welcomeHeading", { name: "Alice" })
   * → "Welcome, Alice!"  (en)
   * → "Welkom, Alice!"   (nl)
   */
  function tp(key, vars = {}) {
    let str = t(key);
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replaceAll(`{{${k}}}`, v);
    });
    return str;
  }

  return { locale, t, tp };
}

// ── Convenience alias ─────────────────────────────────────────────────────────
export const useTranslation = useLocale;