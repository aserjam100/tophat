"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  try {
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      console.error("Auth Error: ", error);
      //redirect("/error");
      return;
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (networkError) {
    console.error("Network Error: ", networkError);
  }
}
