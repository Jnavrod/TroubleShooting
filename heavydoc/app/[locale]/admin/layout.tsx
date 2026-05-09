import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { Settings2, Cpu, Wrench, Upload, LayoutDashboard, ArrowLeft } from "lucide-react";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect(`/${params.locale}/auth/login`);
  }

  const { locale } = params;

  const links = [
    { href: `/${locale}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/${locale}/admin/machines`, label: "Máquinas", icon: Cpu },
    { href: `/${locale}/admin/systems`, label: "Sistemas", icon: Settings2 },
    { href: `/${locale}/admin/tools`, label: "Herramientas", icon: Wrench },
    { href: `/${locale}/admin/import`, label: "Importar", icon: Upload },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar profile={profile} />
      <div className="flex flex-1">
        <aside className="w-52 bg-gray-900 text-gray-300 flex flex-col">
          <div className="px-3 py-4 border-b border-gray-700">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
              Admin
            </p>
          </div>
          <nav className="flex-1 py-3 px-2 space-y-0.5">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 hover:text-white"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-2 pb-3 pt-2 border-t border-gray-700">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800 hover:text-white text-gray-400"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al sitio
            </Link>
          </div>
        </aside>
        <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
