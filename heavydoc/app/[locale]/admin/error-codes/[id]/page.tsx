import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ErrorCodeEditPage from "@/components/admin/ErrorCodeEditPage";
import type { ErrorCode } from "@/types/database";

export default async function AdminErrorCodeDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale, id } = params;
  const supabase = await createClient();

  const { data: ec } = await supabase
    .from("error_codes")
    .select("*, subsystem:subsystems(translations, system:systems(slug, translations))")
    .eq("id", id)
    .single();

  if (!ec) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ecAny = ec as any;
  const subsystemName: string =
    ecAny.subsystem?.translations?.es?.name ?? "";
  const systemName: string =
    ecAny.subsystem?.system?.translations?.es?.name ?? "";
  const systemSlug: string = ecAny.subsystem?.system?.slug ?? "";

  const { data: tools } = await supabase
    .from("tools")
    .select("id, translations")
    .order("created_at");

  const errorCode: ErrorCode = {
    id: ecAny.id,
    subsystem_id: ecAny.subsystem_id,
    code: ecAny.code,
    severity: ecAny.severity,
    translations: ecAny.translations,
    created_at: ecAny.created_at,
    updated_at: ecAny.updated_at,
  };

  return (
    <ErrorCodeEditPage
      locale={locale}
      errorCode={errorCode}
      subsystemName={subsystemName}
      systemName={systemName}
      systemSlug={systemSlug}
      tools={(tools ?? []) as { id: string; translations: Record<string, Record<string, string>> }[]}
    />
  );
}
