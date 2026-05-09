import { createClient } from "@/lib/supabase/server";
import { Cpu, Settings2, Wrench, Code2 } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const supabase = await createClient();

  const [
    { count: machineCount },
    { count: systemCount },
    { count: toolCount },
    { count: errorCodeCount },
  ] = await Promise.all([
    supabase.from("machines").select("*", { count: "exact", head: true }),
    supabase.from("systems").select("*", { count: "exact", head: true }),
    supabase.from("tools").select("*", { count: "exact", head: true }),
    supabase.from("error_codes").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Máquinas", count: machineCount ?? 0, icon: Cpu, href: `/${locale}/admin/machines`, color: "bg-blue-50 text-blue-700" },
    { label: "Sistemas", count: systemCount ?? 0, icon: Settings2, href: `/${locale}/admin/systems`, color: "bg-green-50 text-green-700" },
    { label: "Herramientas", count: toolCount ?? 0, icon: Wrench, href: `/${locale}/admin/tools`, color: "bg-amber-50 text-amber-700" },
    { label: "Códigos de Error", count: errorCodeCount ?? 0, icon: Code2, href: `/${locale}/admin/systems`, color: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, count, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-navy hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{count}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
