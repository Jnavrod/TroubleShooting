import { getTranslations } from "next-intl/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Settings2, Settings } from "lucide-react";
import type { System } from "@/types/database";

export default async function SystemsPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("systems");
  const { locale } = params;

  const [supabase, profile] = await Promise.all([
    createClient(),
    getCurrentProfile(),
  ]);
  const { data } = await supabase.from("systems").select("*").order("created_at");
  const systems = (data ?? []) as System[];

  function getT(
    translations: Record<string, Record<string, string>>,
    field: "name" | "description"
  ) {
    return translations?.[locale]?.[field] ?? translations?.es?.[field] ?? "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        {profile?.role === "admin" && (
          <Link
            href={`/${locale}/admin/systems`}
            className="inline-flex items-center gap-2 bg-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-light transition-colors"
          >
            <Settings className="w-4 h-4" />
            Administrar
          </Link>
        )}
      </div>

      {!systems.length ? (
        <div className="text-center py-16 text-gray-400">
          <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay sistemas registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((system) => {
            const sysT = system.translations as unknown as Record<string, Record<string, string>>;
            return (
              <Link
                key={system.id}
                href={`/${locale}/systems/${system.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-navy hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  {system.icon_url ? (
                    <Image
                      src={system.icon_url}
                      alt={getT(sysT, "name")}
                      width={44}
                      height={44}
                      className="rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 bg-navy-50 rounded-xl flex items-center justify-center">
                      <Settings2 className="w-6 h-6 text-navy/50" />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900 group-hover:text-navy transition-colors">
                    {getT(sysT, "name")}
                  </h3>
                </div>
                {getT(sysT, "description") && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {getT(sysT, "description")}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
