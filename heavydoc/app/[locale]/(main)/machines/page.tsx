import { getTranslations } from "next-intl/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Cpu, Settings } from "lucide-react";
import type { Machine } from "@/types/database";

export default async function MachinesPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("machines");
  const { locale } = params;

  const [supabase, profile] = await Promise.all([
    createClient(),
    getCurrentProfile(),
  ]);

  const { data } = await supabase.from("machines").select("*").order("created_at");
  const machines = (data ?? []) as Machine[];

  function getName(m: Machine) {
    return m.translations?.[locale as keyof typeof m.translations]?.name
      ?? m.translations?.es?.name ?? "";
  }

  function getDesc(m: Machine) {
    return m.translations?.[locale as keyof typeof m.translations]?.description
      ?? m.translations?.es?.description ?? "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        {profile?.role === "admin" && (
          <Link
            href={`/${locale}/admin/machines`}
            className="inline-flex items-center gap-2 bg-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-light transition-colors"
          >
            <Settings className="w-4 h-4" />
            Administrar
          </Link>
        )}
      </div>

      {!machines.length ? (
        <div className="text-center py-16 text-gray-400">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay máquinas registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((machine) => (
            <Link
              key={machine.id}
              href={`/${locale}/machines/${machine.slug}`}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-navy hover:shadow-md transition-all group"
            >
              {machine.image_url ? (
                <div className="relative h-40 w-full">
                  <Image
                    src={machine.image_url}
                    alt={getName(machine)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-32 bg-navy-50 flex items-center justify-center">
                  <Cpu className="w-10 h-10 text-navy/30" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-navy transition-colors">
                  {getName(machine)}
                </h3>
                {getDesc(machine) && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {getDesc(machine)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
