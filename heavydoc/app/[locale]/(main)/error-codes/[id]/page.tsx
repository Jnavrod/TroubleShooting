import { getTranslations } from "next-intl/server";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Zap, Gauge, Flame, AlertTriangle, FlaskConical,
  ShieldAlert, Wrench, Stethoscope, Hammer, Pencil,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import RichEditor from "@/components/editor/RichEditor";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { ensureStepTranslation, type StepRow } from "@/lib/i18n/lazy-translate";
import type { SupportedLocale } from "@/lib/i18n/translate";
import type { HazardIcon, HazardSeverity, Severity, Json } from "@/types/database";

const HAZARD_ICONS: Record<HazardIcon, React.ElementType> = {
  electric: Zap,
  pressure: Gauge,
  burn: Flame,
  crush: AlertTriangle,
  chemical: FlaskConical,
  generic: ShieldAlert,
};

const HAZARD_BG: Record<HazardSeverity, string> = {
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  caution: "bg-orange-50 border-orange-200 text-orange-800",
  danger: "bg-red-50 border-red-200 text-red-800",
};

export default async function ErrorCodePage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const t = await getTranslations("errorCodes");
  const { locale, id } = params;

  const [supabase, profile] = await Promise.all([
    createClient(),
    getCurrentProfile(),
  ]);
  const { data: ec } = await supabase
    .from("error_codes")
    .select(`
      *,
      subsystem:subsystems(*, system:systems(*)),
      diagnostic_steps(*),
      repair_steps(*),
      error_code_tools(*, tool:tools(*)),
      hazards(*)
    `)
    .eq("id", id)
    .single();

  if (!ec) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ecData = ec as any;

  function getT(obj: Record<string, Record<string, string>>, field: string) {
    return obj?.[locale]?.[field] ?? obj?.es?.[field] ?? "";
  }

  const ecT = ecData.translations as Record<string, Record<string, string>>;
  const rawDiagSteps = (ecData.diagnostic_steps ?? []).sort(
    (a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order
  ) as StepRow[];
  const rawRepairSteps = (ecData.repair_steps ?? []).sort(
    (a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order
  ) as StepRow[];

  const localeKey = locale as SupportedLocale;
  const diagnosticSteps = await Promise.all(
    rawDiagSteps.map(async (step) => ({
      id: step.id,
      displayContent: await ensureStepTranslation("diagnostic_steps", step, localeKey),
    }))
  );
  const repairSteps = await Promise.all(
    rawRepairSteps.map(async (step) => ({
      id: step.id,
      displayContent: await ensureStepTranslation("repair_steps", step, localeKey),
    }))
  );
  const ecTools = ecData.error_code_tools ?? [];
  const hazards = (ecData.hazards ?? []).sort(
    (a: { display_order: number }, b: { display_order: number }) =>
      a.display_order - b.display_order
  );
  const subsystem = ecData.subsystem;
  const system = subsystem?.system;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        {system && (
          <>
            <Link
              href={`/${locale}/systems/${system.slug}`}
              className="hover:text-navy transition-colors"
            >
              {getT(system.translations, "name")}
            </Link>
            <span>/</span>
            <span>{getT(subsystem.translations, "name")}</span>
            <span>/</span>
          </>
        )}
        <span className="font-mono font-semibold text-navy">{ecData.code}</span>
      </nav>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-lg font-bold bg-navy text-white px-3 py-1 rounded-lg">
                {ecData.code}
              </span>
              <Badge variant={ecData.severity as Severity}>
                {t(
                  `severity${ecData.severity.charAt(0).toUpperCase() + ecData.severity.slice(1)}` as Parameters<typeof t>[0]
                )}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {getT(ecT, "title")}
            </h1>
            {getT(ecT, "description") && (
              <p className="text-gray-600">{getT(ecT, "description")}</p>
            )}
          </div>
          {profile?.role === "admin" && (
            <Link
              href={`/${locale}/admin/error-codes/${ecData.id}`}
              className="inline-flex items-center gap-2 bg-navy text-white text-sm font-medium px-3.5 py-1.5 rounded-lg hover:bg-navy-light transition-colors flex-shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* LEFT: Diagnostic + Repair */}
        <div className="lg:col-span-2 space-y-4">
          <CollapsibleSection
            title={t("tabs.diagnostic")}
            icon={<Stethoscope className="w-4 h-4 text-blue-500" />}
            count={diagnosticSteps.length}
          >
            <StepsSection steps={diagnosticSteps} />
          </CollapsibleSection>

          <CollapsibleSection
            title={t("tabs.repair")}
            icon={<Hammer className="w-4 h-4 text-green-600" />}
            count={repairSteps.length}
            defaultOpen={false}
          >
            <StepsSection steps={repairSteps} />
          </CollapsibleSection>
        </div>

        {/* RIGHT: Hazards + Tools */}
        <div className="space-y-4">
          {hazards.length > 0 && (
            <CollapsibleSection
              title={t("tabs.hazards")}
              icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
              count={hazards.length}
            >
              <div className="p-4 space-y-3">
                {hazards.map(
                  (hazard: {
                    id: string;
                    severity: HazardSeverity;
                    icon: HazardIcon;
                    translations: Record<string, Record<string, string>>;
                  }) => {
                    const HazardIcon_ = HAZARD_ICONS[hazard.icon];
                    return (
                      <div
                        key={hazard.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${HAZARD_BG[hazard.severity]}`}
                      >
                        <HazardIcon_ className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">
                            {getT(hazard.translations, "title")}
                          </p>
                          {getT(hazard.translations, "description") && (
                            <p className="text-xs mt-0.5 opacity-80">
                              {getT(hazard.translations, "description")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CollapsibleSection>
          )}

          {ecTools.length > 0 && (
            <CollapsibleSection
              title={t("tabs.tools")}
              icon={<Wrench className="w-4 h-4 text-navy" />}
              count={ecTools.length}
            >
              <div className="p-4 space-y-2">
                {ecTools.map(
                  (ect: {
                    tool: {
                      id: string;
                      image_url: string | null;
                      part_number: string | null;
                      translations: Record<string, Record<string, string>>;
                    };
                    quantity: number | null;
                    notes: string | null;
                  }) => {
                    const tool = ect.tool;
                    if (!tool) return null;
                    return (
                      <div
                        key={tool.id}
                        className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3"
                      >
                        {tool.image_url ? (
                          <Image
                            src={tool.image_url}
                            alt={getT(tool.translations, "name")}
                            width={44}
                            height={44}
                            className="rounded-lg object-contain bg-white border border-gray-100"
                          />
                        ) : (
                          <div className="w-11 h-11 bg-white border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Wrench className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getT(tool.translations, "name")}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {ect.quantity && <span>x{ect.quantity}</span>}
                            {tool.part_number && <span className="font-mono">{tool.part_number}</span>}
                          </div>
                          {ect.notes && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{ect.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>
    </div>
  );
}

function StepsSection({
  steps,
}: {
  steps: { id: string; displayContent: Json }[];
}) {
  if (!steps.length) {
    return (
      <p className="px-5 py-6 text-sm text-gray-400 text-center">
        No hay pasos registrados.
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {steps.map((step, i) => (
        <div key={step.id} className="px-5 py-4">
          <span className="inline-block text-xs font-semibold text-navy uppercase tracking-wide mb-3">
            Paso {i + 1}
          </span>
          <RichEditor initialContent={step.displayContent} readOnly />
        </div>
      ))}
    </div>
  );
}
