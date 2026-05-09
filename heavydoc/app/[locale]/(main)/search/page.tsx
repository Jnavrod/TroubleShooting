import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Severity } from "@/types/database";

interface SearchResult {
  type: string;
  id: string;
  code: string | null;
  name: string;
  description: string;
  severity: string | null;
  slug: string | null;
  rank: number;
}

export default async function SearchPage({
  searchParams,
  params,
}: {
  searchParams: { q?: string };
  params: { locale: string };
}) {
  const t = await getTranslations("search");
  const tErr = await getTranslations("errorCodes");
  const { locale } = params;
  const query = searchParams.q?.trim() ?? "";

  let results: SearchResult[] = [];

  if (query.length >= 2) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("search_global", {
      query,
      locale,
    } as Record<string, unknown>);
    results = (data as SearchResult[]) ?? [];
  }

  function severityLabel(s: string) {
    return tErr(`severity${s.charAt(0).toUpperCase() + s.slice(1)}` as Parameters<typeof tErr>[0]);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <form className="bg-white border border-gray-200 rounded-xl flex items-center gap-3 px-4">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          name="q"
          defaultValue={query}
          placeholder={t("placeholder")}
          autoFocus
          className="w-full py-3.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
        />
      </form>

      {query && (
        <p className="text-sm text-gray-500">
          {results.length} {t("results")}{" "}
          <span className="font-semibold text-gray-800">&ldquo;{query}&rdquo;</span>
        </p>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>
            {t("noResults")} &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      <div className="space-y-2">
        {results.map((r) => (
          <Link
            key={`${r.type}-${r.id}`}
            href={
              r.type === "error_code"
                ? `/${locale}/error-codes/${r.id}`
                : `/${locale}/systems/${r.slug}`
            }
            className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-navy hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-accent uppercase tracking-wide">
                    {r.type === "error_code"
                      ? t("categories.errorCodes")
                      : r.type === "system"
                      ? t("categories.systems")
                      : t("categories.subsystems")}
                  </span>
                  {r.code && (
                    <span className="font-mono text-xs bg-navy-50 text-navy px-1.5 py-0.5 rounded font-semibold">
                      {r.code}
                    </span>
                  )}
                </div>
                <p className="font-medium text-gray-900 truncate">{r.name}</p>
                {r.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                )}
              </div>
              {r.severity && (
                <Badge variant={r.severity as Severity}>
                  {severityLabel(r.severity)}
                </Badge>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
