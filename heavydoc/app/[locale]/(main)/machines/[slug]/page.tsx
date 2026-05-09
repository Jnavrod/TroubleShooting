import { getTranslations } from "next-intl/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Settings2, ChevronRight, Pencil } from "lucide-react";
import type { Machine, System } from "@/types/database";

export default async function MachineDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations("machines");
  const { locale, slug } = params;

  const [supabase, profile] = await Promise.all([
    createClient(),
    getCurrentProfile(),
  ]);
  const { data } = await supabase
    .from("machines")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!data) notFound();
  const machine = data as Machine;

  const { data: machineSystems } = await supabase
    .from("machine_systems")
    .select("display_order, system:systems(*)")
    .eq("machine_id", machine.id)
    .order("display_order");

  const systems = ((machineSystems ?? []).map((ms) => (ms as { system: unknown }).system)) as System[];

  function getT(
    translations: Record<string, Record<string, string>>,
    field: "name" | "description"
  ) {
    return translations?.[locale]?.[field] ?? translations?.es?.[field] ?? "";
  }

  const machineT = machine.translations as unknown as Record<string, Record<string, string>>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={`/${locale}/machines`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
        >
          ← {t("title")}
        </Link>
        {profile?.role === "admin" && (
          <Link
            href={`/${locale}/admin/machines`}
            className="inline-flex items-center gap-2 bg-navy text-white text-sm font-medium px-3.5 py-1.5 rounded-lg hover:bg-navy-light transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Link>
        )}
      </div>

      {/* Machine header */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {machine.image_url && (
          <div className="relative h-56 w-full">
            <Image
              src={machine.image_url}
              alt={getT(machineT, "name")}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <h1 className="absolute bottom-4 left-6 text-2xl font-bold text-white">
              {getT(machineT, "name")}
            </h1>
          </div>
        )}
        {!machine.image_url && (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">{getT(machineT, "name")}</h1>
          </div>
        )}
        {getT(machineT, "description") && (
          <p className="px-6 py-4 text-gray-600">{getT(machineT, "description")}</p>
        )}
      </div>

      {/* Systems */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-navy" />
          {t("systems")}
        </h2>
        {!systems.length ? (
          <p className="text-gray-400 text-sm">{t("noSystems")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {systems.map((system) => {
              const sysT = system.translations as unknown as Record<string, Record<string, string>>;
              return (
                <Link
                  key={system.id}
                  href={`/${locale}/systems/${system.slug}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-navy hover:shadow-md transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {system.icon_url ? (
                      <Image
                        src={system.icon_url}
                        alt={getT(sysT, "name")}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center">
                        <Settings2 className="w-5 h-5 text-navy/50" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-navy transition-colors">
                        {getT(sysT, "name")}
                      </p>
                      {getT(sysT, "description") && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {getT(sysT, "description")}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-navy transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
