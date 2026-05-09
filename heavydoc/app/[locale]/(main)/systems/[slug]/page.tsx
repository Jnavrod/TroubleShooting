import { getTranslations } from "next-intl/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Severity, System, Subsystem, ErrorCode } from "@/types/database";

type SubsystemWithEC = Subsystem & { error_codes: ErrorCode[] };

export default async function SystemDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations("systems");
  const tErr = await getTranslations("errorCodes");
  const { locale, slug } = params;

  const [supabase, profile] = await Promise.all([
    createClient(),
    getCurrentProfile(),
  ]);
  const { data } = await supabase
    .from("systems")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) notFound();
  const system = data as System;

  const { data: subsData } = await supabase
    .from("subsystems")
    .select("*, error_codes(id, code, severity, translations)")
    .eq("system_id", system.id)
    .order("display_order");

  const subsystems = (subsData ?? []) as SubsystemWithEC[];

  function getT(
    translations: Record<string, Record<string, string>>,
    field: string
  ) {
    return translations?.[locale]?.[field] ?? translations?.es?.[field] ?? "";
  }

  const sysT = system.translations as unknown as Record<string, Record<string, string>>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={`/${locale}/systems`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
        >
          ← {t("title")}
        </Link>
        {profile?.role === "admin" && (
          <Link
            href={`/${locale}/admin/systems`}
            className="inline-flex items-center gap-2 bg-navy text-white text-sm font-medium px-3.5 py-1.5 rounded-lg hover:bg-navy-light transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Link>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getT(sysT, "name")}</h1>
        {getT(sysT, "description") && (
          <p className="text-gray-500 mt-1">{getT(sysT, "description")}</p>
        )}
      </div>

      <div className="space-y-4">
        {!subsystems.length ? (
          <p className="text-gray-400 text-sm">{t("noSubsystems")}</p>
        ) : (
          subsystems.map((sub) => {
            const subT = sub.translations as unknown as Record<string, Record<string, string>>;
            return (
              <div key={sub.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-navy-50">
                  <h3 className="font-semibold text-navy">{getT(subT, "name")}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {!sub.error_codes?.length ? (
                    <p className="px-5 py-4 text-sm text-gray-400">Sin códigos de error.</p>
                  ) : (
                    sub.error_codes.map((ec) => {
                      const ecT = ec.translations as unknown as Record<string, Record<string, string>>;
                      return (
                        <Link
                          key={ec.id}
                          href={`/${locale}/error-codes/${ec.id}`}
                          className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-semibold text-navy text-sm bg-navy-50 px-2 py-0.5 rounded">
                              {ec.code}
                            </span>
                            <span className="text-sm text-gray-700">
                              {getT(ecT, "title")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={ec.severity as Severity}>
                              {tErr(`severity${ec.severity.charAt(0).toUpperCase() + ec.severity.slice(1)}` as Parameters<typeof tErr>[0])}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-navy" />
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
