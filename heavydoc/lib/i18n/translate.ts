const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

export type SupportedLocale = "es" | "en" | "pt";

export async function translateText(
  text: string,
  from: SupportedLocale,
  to: SupportedLocale
): Promise<string> {
  if (!text?.trim() || from === to) return text;

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${from}|${to}`,
    });
    const res = await fetch(`${MYMEMORY_URL}?${params}`);
    if (!res.ok) return text;

    const data = await res.json();
    return data?.responseData?.translatedText ?? text;
  } catch {
    return text;
  }
}

export async function autoTranslate(
  text: string,
  sourceLang: SupportedLocale = "es"
): Promise<Record<SupportedLocale, string>> {
  const targets = (["es", "en", "pt"] as SupportedLocale[]).filter(
    (l) => l !== sourceLang
  );

  const translations = await Promise.all(
    targets.map((target) => translateText(text, sourceLang, target))
  );

  const result: Record<SupportedLocale, string> = { es: "", en: "", pt: "" };
  result[sourceLang] = text;
  targets.forEach((lang, i) => {
    result[lang] = translations[i];
  });

  return result;
}

export async function translateTiptapJson(
  json: unknown,
  from: SupportedLocale,
  to: SupportedLocale
): Promise<unknown> {
  if (from === to || !json) return json;

  const clone = JSON.parse(JSON.stringify(json));
  const textNodes: Array<Record<string, unknown>> = [];

  function collect(node: unknown): void {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(collect); return; }
    const n = node as Record<string, unknown>;
    if (n.type === "text" && typeof n.text === "string" && n.text.trim()) {
      textNodes.push(n);
    }
    if (n.content) collect(n.content);
  }
  collect(clone);

  if (!textNodes.length) return clone;

  await Promise.all(
    textNodes.map(async (n) => {
      n.text = await translateText(n.text as string, from, to);
    })
  );

  return clone;
}

export async function autoTranslateFields(
  fields: Record<string, string>,
  sourceLang: SupportedLocale = "es"
): Promise<Record<string, Record<SupportedLocale, string>>> {
  const entries = await Promise.all(
    Object.entries(fields).map(async ([key, value]) => {
      const translations = await autoTranslate(value, sourceLang);
      return [key, translations];
    })
  );

  return Object.fromEntries(entries);
}
