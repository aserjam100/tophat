import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-light text-slate-800 mb-8">
            Welcome to your Dashboard
          </h1>

          <div className="bg-stone-100/50 p-6 rounded-lg border border-stone-200/60">
            <p className="text-stone-600 text-sm mb-2">Logged in as:</p>
            <p className="text-slate-800 text-lg font-medium">
              {data.user.email}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
