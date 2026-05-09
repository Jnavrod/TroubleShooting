"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { autoTranslateFields } from "@/lib/i18n/translate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export async function createSystem(data: {
  nameEs: string;
  descriptionEs: string;
  iconUrl: string | null;
}) {
  const supabase = await createClient();
  const slug = slugify(data.nameEs);

  const translations = await autoTranslateFields(
    { name: data.nameEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    slug,
    icon_url: data.iconUrl,
    translations: {
      es: { name: translations.name.es, description: translations.description.es },
      en: { name: translations.name.en, description: translations.description.en },
      pt: { name: translations.name.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase.from("systems").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "page");
}

export async function updateSystem(
  id: string,
  data: { nameEs: string; descriptionEs: string; iconUrl: string | null }
) {
  const supabase = await createClient();
  const slug = slugify(data.nameEs);

  const translations = await autoTranslateFields(
    { name: data.nameEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    slug,
    icon_url: data.iconUrl,
    translations: {
      es: { name: translations.name.es, description: translations.description.es },
      en: { name: translations.name.en, description: translations.description.en },
      pt: { name: translations.name.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase
    .from("systems")
    .update(payload as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "layout");
}

export async function deleteSystem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("systems").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "page");
}

export async function createSubsystem(data: {
  systemId: string;
  nameEs: string;
  descriptionEs: string;
  displayOrder: number;
}) {
  const supabase = await createClient();
  const slug = slugify(data.nameEs);

  const translations = await autoTranslateFields(
    { name: data.nameEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    system_id: data.systemId,
    slug,
    display_order: data.displayOrder,
    translations: {
      es: { name: translations.name.es, description: translations.description.es },
      en: { name: translations.name.en, description: translations.description.en },
      pt: { name: translations.name.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase.from("subsystems").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "layout");
}

export async function updateSubsystem(
  id: string,
  data: { nameEs: string; descriptionEs: string }
) {
  const supabase = await createClient();
  const slug = slugify(data.nameEs);

  const translations = await autoTranslateFields(
    { name: data.nameEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    slug,
    translations: {
      es: { name: translations.name.es, description: translations.description.es },
      en: { name: translations.name.en, description: translations.description.en },
      pt: { name: translations.name.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase
    .from("subsystems")
    .update(payload as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "layout");
}

export async function deleteSubsystem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subsystems").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/systems", "layout");
}
