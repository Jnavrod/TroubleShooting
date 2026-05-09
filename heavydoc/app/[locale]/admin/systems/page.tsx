import { createClient } from "@/lib/supabase/server";
import SystemsAdmin from "@/components/admin/SystemsAdmin";

export default async function AdminSystemsPage({
  params,
}: {
  params: { locale: string };
}) {
  const supabase = await createClient();
  const { data: systems } = await supabase
    .from("systems")
    .select("*, subsystems(*, error_codes(*))")
    .order("created_at");

  const { data: tools } = await supabase
    .from("tools")
    .select("id, translations")
    .order("created_at");

  return <SystemsAdmin systems={systems ?? []} tools={tools ?? []} locale={params.locale} />;
}
