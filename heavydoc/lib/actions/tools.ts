"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { autoTranslateFields } from "@/lib/i18n/translate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export async function createTool(data: {
  nameEs: string;
  descriptionEs: string;
  imageUrl: string | null;
  partNumber: string | null;
}) {
  const supabase = await createClient();

  const translations = await autoTranslateFields(
    { name: data.nameEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    image_url: data.imageUrl,
    part_number: data.partNumber,
    translations: {
      es: { name: translations.name.es, description: translations.description.es },
      en: { name: translations.name.en, description: translations.description.en },
      pt: { name: translations.name.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase.from("tools").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/tools", "page");
}

export async function updateTool(
  id: string,
  data: {
    nameEs: string;
    descriptionEs: string;
    imageUrl: string | null;
    partNumber: string | null;
  }
) {
  const supabase = await createClient();

  const translations = await autoTranslateFields(
    { name: data.nameEs, description: data.descriptionEs },
    "es"
  );

  const payload: AnyRecord = {
    image_url: data.imageUrl,
    part_number: data.partNumber,
    translations: {
      es: { name: translations.name.es, description: translations.description.es },
      en: { name: translations.name.en, description: translations.description.en },
      pt: { name: translations.name.pt, description: translations.description.pt },
    },
  };

  const { error } = await supabase
    .from("tools")
    .update(payload as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/tools", "page");
}

export async function deleteTool(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tools").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/[locale]/(main)/tools", "page");
}
