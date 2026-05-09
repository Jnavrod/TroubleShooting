"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Home,
  Cpu,
  Settings2,
  Wrench,
  Search,
  ShieldAlert,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "home", icon: Home, href: "" },
  { key: "machines", icon: Cpu, href: "/machines" },
  { key: "systems", icon: Settings2, href: "/systems" },
  { key: "tools", icon: Wrench, href: "/tools" },
  { key: "search", icon: Search, href: "/search" },
] as const;

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  function isActive(href: string) {
    const full = `/${locale}${href}`;
    if (href === "") return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(full);
  }

  return (
    <aside className="w-56 bg-navy min-h-full flex flex-col">
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map(({ key, icon: Icon, href }) => (
          <Link
            key={key}
            href={`/${locale}${href}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
              isActive(href)
                ? "bg-accent text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            <span className="flex-1">{t(key as keyof typeof t)}</span>
            {isActive(href) && (
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            )}
          </Link>
        ))}
      </nav>

      {isAdmin && (
        <div className="px-2 pb-2">
          <div className="border-t border-white/10 pt-2">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-3 py-1">
              {t("admin")}
            </p>
            <Link
              href={`/${locale}/admin`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith(`/${locale}/admin`)
                  ? "bg-accent text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <LayoutDashboard className="w-4.5 h-4.5 flex-shrink-0" />
              <span className="flex-1">Panel Admin</span>
            </Link>
          </div>
        </div>
      )}

      <div className="px-2 pb-4">
        <div className="border-t border-white/10 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 text-white/30 text-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Trouble Shooting v1.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
