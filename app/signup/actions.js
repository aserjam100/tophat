"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signup(formData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Optional: Check if password confirmation matches
  const confirmPassword = formData.get("confirmPassword");
  if (data.password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.error("Signup error: ", error);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
