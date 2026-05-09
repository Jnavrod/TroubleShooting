import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/${params.locale}/auth/login`);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar profile={profile} />
      <div className="flex flex-1">
        <Sidebar isAdmin={profile.role === "admin"} />
        <main className="flex-1 bg-gray-50 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
