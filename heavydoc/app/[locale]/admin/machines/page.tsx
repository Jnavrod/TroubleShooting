import { createClient } from "@/lib/supabase/server";
import MachinesAdmin from "@/components/admin/MachinesAdmin";

export default async function AdminMachinesPage({
  params,
}: {
  params: { locale: string };
}) {
  const supabase = await createClient();
  const [{ data: machines }, { data: systems }] = await Promise.all([
    supabase.from("machines").select("*").order("created_at"),
    supabase.from("systems").select("*").order("created_at"),
  ]);

  const { data: machineSystems } = await supabase
    .from("machine_systems")
    .select("machine_id, system_id, display_order");

  return (
    <MachinesAdmin
      machines={machines ?? []}
      systems={systems ?? []}
      machineSystems={machineSystems ?? []}
      locale={params.locale}
    />
  );
}
