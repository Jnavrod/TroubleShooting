import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Search, Cpu, Settings2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Machine, System } from "@/types/database";

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("home");
  const navT = await getTranslations("nav");
  const { locale } = params;

  const supabase = await createClient();
  const [{ data: machinesData }, { data: systemsData }] = await Promise.all([
    supabase.from("machines").select("id, slug, translations, image_url").limit(6),
    supabase.from("systems").select("id, slug, translations, icon_url").limit(6),
  ]);

  const machines = (machinesData ?? []) as Machine[];
  const systems = (systemsData ?? []) as System[];

  function getName(item: Machine | System) {
    const t = item.translations as unknown as Record<string, Record<string, string>>;
    return t?.[locale]?.name ?? t?.es?.name ?? "";
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero search */}
      <div className="bg-navy rounded-2xl p-8 text-white text-center">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-white/70 mb-6">{t("subtitle")}</p>
        <Link
          href={`/${locale}/search`}
          className="flex items-center gap-3 bg-white text-gray-500 rounded-xl px-5 py-3.5 max-w-lg mx-auto hover:shadow-md transition-shadow"
        >
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-sm">{t("searchPlaceholder")}</span>
        </Link>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/${locale}/machines`}
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-navy hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center group-hover:bg-navy transition-colors">
              <Cpu className="w-6 h-6 text-navy group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{t("browseMachines")}</p>
              <p className="text-sm text-gray-500">
                {machines.length} {navT("machines").toLowerCase()}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}/systems`}
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-navy hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center group-hover:bg-navy transition-colors">
              <Settings2 className="w-6 h-6 text-navy group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{t("browseSystems")}</p>
              <p className="text-sm text-gray-500">
                {systems.length} {navT("systems").toLowerCase()}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent machines */}
      {machines.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {navT("machines")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {machines.map((machine) => (
              <Link
                key={machine.id}
                href={`/${locale}/machines/${machine.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-accent hover:shadow-md transition-all text-sm font-medium text-gray-800 truncate"
              >
                {getName(machine)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
