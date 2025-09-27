import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import NewTestClient from "./NewTestClient";

export default async function NewTestPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login");
  }

  return <NewTestClient user={userData.user} />;
}