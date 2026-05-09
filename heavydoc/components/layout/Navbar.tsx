"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LogOut, User, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { signOut } from "@/lib/actions/auth";
import LocaleSwitcher from "./LocaleSwitcher";
import type { Profile } from "@/types/database";

interface NavbarProps {
  profile: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  async function handleLogout() {
    await signOut(locale);
  }

  return (
    <header className="bg-navy shadow-md sticky top-0 z-40">
      <div className="flex items-center justify-between h-14 pl-4 pr-4 sm:pr-6">
        {/* Brand */}
        <Link
          href={`/${locale}`}
          className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <Image
            src="/TLatam.png"
            alt="Trouble Shooting"
            height={36}
            width={140}
            className="h-9 w-auto object-left"
            priority
          />
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />

          {profile && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {profile.full_name ?? profile.email}
                </span>
                {profile.role !== "admin" && (
                  <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide bg-white/15 text-white/70 rounded px-1.5 py-0.5">
                    {profile.role === "tecnico" ? "Técnico" : "Lector"}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50 min-w-[160px]">
                  {profile.role === "admin" && (
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-navy-50 hover:text-navy transition-colors"
                    >
                      {t("admin")}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
