import { createClient } from "@/lib/supabase/server";
import { translateTiptapJson, type SupportedLocale } from "./translate";
import type { Json } from "@/types/database";

type StepTranslations = {
  es?: { content_json: Json };
  en?: { content_json: Json };
  pt?: { content_json: Json };
} | null;

export type StepRow = {
  id: string;
  content_json: Json;
  translations: StepTranslations;
};

function hasContent(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  return Object.keys(json as object).length > 0;
}

/**
 * Devuelve el content_json del paso para `locale`, traduciendo desde ES y
 * persistiendo en `translations` si aún no existía. Si el locale es "es"
 * devuelve el original sin tocar la BD.
 */
export async function ensureStepTranslation(
  table: "diagnostic_steps" | "repair_steps",
  step: StepRow,
  locale: SupportedLocale
): Promise<Json> {
  if (locale === "es") return step.content_json;

  const cached = step.translations?.[locale]?.content_json;
  if (hasContent(cached)) return cached as Json;

  const translated = (await translateTiptapJson(
    step.content_json,
    "es",
    locale
  )) as Json;

  try {
    const supabase = await createClient();
    const updated = {
      es: step.translations?.es ?? { content_json: step.content_json },
      en:
        locale === "en"
          ? { content_json: translated }
          : step.translations?.en ?? { content_json: step.content_json },
      pt:
        locale === "pt"
          ? { content_json: translated }
          : step.translations?.pt ?? { content_json: step.content_json },
    };
    await supabase
      .from(table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ translations: updated } as any)
      .eq("id", step.id);
  } catch {
    // best-effort: si falla la persistencia igual entregamos la traducción
  }

  return translated;
}
