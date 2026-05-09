import { createClient } from "@/lib/supabase/server";
import ToolsAdmin from "@/components/admin/ToolsAdmin";

export default async function AdminToolsPage() {
  const supabase = await createClient();
  const { data: tools } = await supabase
    .from("tools")
    .select("*")
    .order("created_at");

  return <ToolsAdmin tools={tools ?? []} />;
}
