import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import ViewTestClient from "./ViewTestClient";

export default async function ViewTestPage({ params }) {
  // Await params first
  const resolvedParams = await params;
  const testId = resolvedParams.testId; // Changed from testid to testId

  //console.log("=== VIEW TEST PAGE ===");
  //console.log("Resolved params:", resolvedParams);
  //console.log("Test ID:", testId);

  if (!testId || testId === "undefined") {
    console.error("Invalid test ID");
    notFound();
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login");
  }

  // Fetch the test from the database
  const { data: test, error } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .eq("user_id", userData.user.id)
    .single();

  //console.log("Test query:", { test, error });

  if (error || !test) {
    console.error("Error fetching test:", error);
    notFound();
  }

  return <ViewTestClient user={userData.user} test={test} />;
}
