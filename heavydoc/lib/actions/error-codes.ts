"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { autoTranslateFields, translateTiptapJson } from "@/lib/i18n/translate";
import type { HazardIcon, HazardSeverity, Severity, Json } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export async function createErrorCode(data: {
  subsystemId: string;
  code: string;
  severity: Severity;
  titleEs: string;
  descriptionEs: string;
}) {
  const supabase = await createClient();

  const translations = await autoTranslateFields(
    { title: data.titleEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    subsystem_id: data.subsystemId,
    code: data.code,
    severity: data.severity,
    translations: {
      es: { title: translations.title.es, description: translations.description.es },
      en: { title: translations.title.en, description: translations.description.en },
      pt: { title: translations.title.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase.from("error_codes").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "layout");
}

export async function updateErrorCode(
  id: string,
  data: {
    code: string;
    severity: Severity;
    titleEs: string;
    descriptionEs: string;
  }
) {
  const supabase = await createClient();

  const translations = await autoTranslateFields(
    { title: data.titleEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    code: data.code,
    severity: data.severity,
    translations: {
      es: { title: translations.title.es, description: translations.description.es },
      en: { title: translations.title.en, description: translations.description.en },
      pt: { title: translations.title.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase
    .from("error_codes")
    .update(payload as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "layout");
}

export async function deleteErrorCode(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("error_codes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "layout");
}

export async function saveStep(
  table: "diagnostic_steps" | "repair_steps",
  step: { id?: string; error_code_id: string; step_order: number; content_json: Json }
) {
  const supabase = await createClient();

  const [enJson, ptJson] = await Promise.all([
    translateTiptapJson(step.content_json, "es", "en"),
    translateTiptapJson(step.content_json, "es", "pt"),
  ]);

  const stepTranslations = {
    es: { content_json: step.content_json },
    en: { content_json: enJson },
    pt: { content_json: ptJson },
  };

  if (step.id) {
    const { error } = await supabase
      .from(table)
      .update({
        step_order: step.step_order,
        content_json: step.content_json,
        translations: stepTranslations,
      } as never)
      .eq("id", step.id);
    if (error) throw new Error(error.message);
  } else {
    const payload: AnyRecord = {
      error_code_id: step.error_code_id,
      step_order: step.step_order,
      content_json: step.content_json,
      translations: stepTranslations,
    };
    const { error } = await supabase.from(table).insert(payload as never);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/[locale]/(main)", "layout");
}

export async function retranslateAllSteps(errorCodeId: string) {
  const supabase = await createClient();

  const [diagRes, repairRes] = await Promise.all([
    supabase.from("diagnostic_steps").select("id, content_json, step_order").eq("error_code_id", errorCodeId),
    supabase.from("repair_steps").select("id, content_json, step_order").eq("error_code_id", errorCodeId),
  ]);

  const all = [
    ...(diagRes.data ?? []).map((s) => ({ ...s, table: "diagnostic_steps" as const })),
    ...(repairRes.data ?? []).map((s) => ({ ...s, table: "repair_steps" as const })),
  ];

  for (const step of all) {
    const [enJson, ptJson] = await Promise.all([
      translateTiptapJson(step.content_json, "es", "en"),
      translateTiptapJson(step.content_json, "es", "pt"),
    ]);
    await supabase.from(step.table).update({
      translations: {
        es: { content_json: step.content_json },
        en: { content_json: enJson },
        pt: { content_json: ptJson },
      },
    } as never).eq("id", step.id);
  }

  revalidatePath("/[locale]/(main)", "layout");
}

export async function deleteStep(
  table: "diagnostic_steps" | "repair_steps",
  id: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)", "layout");
}

export async function createHazard(data: {
  errorCodeId: string;
  severity: HazardSeverity;
  icon: HazardIcon;
  titleEs: string;
  descriptionEs: string;
  displayOrder: number;
}) {
  const supabase = await createClient();

  const translations = await autoTranslateFields(
    { title: data.titleEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    error_code_id: data.errorCodeId,
    severity: data.severity,
    icon: data.icon,
    display_order: data.displayOrder,
    translations: {
      es: { title: translations.title.es, description: translations.description.es },
      en: { title: translations.title.en, description: translations.description.en },
      pt: { title: translations.title.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase.from("hazards").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)", "layout");
}

export async function updateHazard(
  id: string,
  data: {
    severity: HazardSeverity;
    icon: HazardIcon;
    titleEs: string;
    descriptionEs: string;
  }
) {
  const supabase = await createClient();

  const translations = await autoTranslateFields(
    { title: data.titleEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    severity: data.severity,
    icon: data.icon,
    translations: {
      es: { title: translations.title.es, description: translations.description.es },
      en: { title: translations.title.en, description: translations.description.en },
      pt: { title: translations.title.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase.from("hazards").update(payload as never).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)", "layout");
}

export async function deleteHazard(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("hazards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)", "layout");
}

export async function addToolToErrorCode(
  errorCodeId: string,
  toolId: string,
  quantity: number | null,
  notes: string | null
) {
  const supabase = await createClient();
  const payload: AnyRecord = {
    error_code_id: errorCodeId,
    tool_id: toolId,
    quantity,
    notes,
  };
  const { error } = await supabase.from("error_code_tools").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)", "layout");
}

export async function updateErrorCodeTool(
  errorCodeId: string,
  toolId: string,
  data: { quantity: number | null; notes: string | null }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("error_code_tools")
    .update({ quantity: data.quantity, notes: data.notes } as never)
    .eq("error_code_id", errorCodeId)
    .eq("tool_id", toolId);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)", "layout");
}

export async function removeToolFromErrorCode(errorCodeId: string, toolId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("error_code_tools")
    .delete()
    .eq("error_code_id", errorCodeId)
    .eq("tool_id", toolId);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)", "layout");
}
