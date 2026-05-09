"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { autoTranslateFields } from "@/lib/i18n/translate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export async function createMachine(data: {
  nameEs: string;
  descriptionEs: string;
  imageUrl: string | null;
}) {
  const supabase = await createClient();
  const slug = slugify(data.nameEs);

  const translations = await autoTranslateFields(
    { name: data.nameEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    slug,
    image_url: data.imageUrl,
    translations: {
      es: { name: translations.name.es, description: translations.description.es },
      en: { name: translations.name.en, description: translations.description.en },
      pt: { name: translations.name.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase.from("machines").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/machines", "page");
}

export async function updateMachine(
  id: string,
  data: { nameEs: string; descriptionEs: string; imageUrl: string | null }
) {
  const supabase = await createClient();
  const slug = slugify(data.nameEs);

  const translations = await autoTranslateFields(
    { name: data.nameEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    slug,
    image_url: data.imageUrl,
    translations: {
      es: { name: translations.name.es, description: translations.description.es },
      en: { name: translations.name.en, description: translations.description.en },
      pt: { name: translations.name.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase
    .from("machines")
    .update(payload as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/machines", "layout");
}

export async function deleteMachine(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("machines").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/machines", "page");
}

export async function assignSystemToMachine(
  machineId: string,
  systemId: string,
  order: number
) {
  const supabase = await createClient();
  const payload: AnyRecord = {
    machine_id: machineId,
    system_id: systemId,
    display_order: order,
  };
  const { error } = await supabase.from("machine_systems").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function removeSystemFromMachine(machineId: string, systemId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("machine_systems")
    .delete()
    .eq("machine_id", machineId)
    .eq("system_id", systemId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
