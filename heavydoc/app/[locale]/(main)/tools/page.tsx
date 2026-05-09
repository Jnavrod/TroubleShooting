import { getTranslations } from "next-intl/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Wrench, Settings } from "lucide-react";
import type { Tool } from "@/types/database";

export default async function ToolsPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("tools");
  const tCommon = await getTranslations("common");
  const { locale } = params;

  const [supabase, profile] = await Promise.all([
    createClient(),
    getCurrentProfile(),
  ]);
  const { data } = await supabase.from("tools").select("*").order("created_at");
  const tools = (data ?? []) as Tool[];

  function getT(
    translations: Record<string, Record<string, string>>,
    field: "name" | "description"
  ) {
    return translations?.[locale]?.[field] ?? translations?.es?.[field] ?? "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("catalog")}</h1>
        {profile?.role === "admin" && (
          <Link
            href={`/${locale}/admin/tools`}
            className="inline-flex items-center gap-2 bg-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-light transition-colors"
          >
            <Settings className="w-4 h-4" />
            Administrar
          </Link>
        )}
      </div>

      {!tools.length ? (
        <div className="text-center py-16 text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay herramientas registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map((tool) => {
            const toolT = tool.translations as unknown as Record<string, Record<string, string>>;
            return (
              <div
                key={tool.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {tool.image_url ? (
                  <div className="relative h-36 w-full bg-gray-50">
                    <Image
                      src={tool.image_url}
                      alt={getT(toolT, "name")}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="h-28 bg-gray-50 flex items-center justify-center">
                    <Wrench className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium text-sm text-gray-900 line-clamp-2">
                    {getT(toolT, "name")}
                  </p>
                  {tool.part_number && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tCommon("partNumber")}: {tool.part_number}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
