import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Play, Plus } from "lucide-react";
import TestItem from "@/components/TestItem";

export default async function TestsList() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    redirect("/login");
  }

  // Fetch tests for the current user, ordered by created_at DESC
  const { data: tests, error } = await supabase
    .from("tests")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tests:", error);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="p-8">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-light text-slate-800 mb-2">
                Dashboard
              </h1>
              <p className="text-stone-600">
                Manage and view your Puppeteer test executions
              </p>
            </div>
            <Button asChild className="bg-slate-800 hover:bg-slate-700">
              <Link href="/dashboard/tests/new">
                <Plus size={16} className="mr-2" />
                Create New Test
              </Link>
            </Button>
          </div>

          {/* Summary Stats */}
          {tests && tests.length > 0 && (
            <div className="mt-8 pb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-stone-200/60">
                <div className="text-2xl font-semibold text-slate-800">
                  {tests.length}
                </div>
                <div className="text-sm text-stone-600">Total Tests</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-stone-200/60">
                <div className="text-2xl font-semibold text-green-600">
                  {tests.filter((t) => t.status === "passed").length}
                </div>
                <div className="text-sm text-stone-600">Passed</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-stone-200/60">
                <div className="text-2xl font-semibold text-red-600">
                  {tests.filter((t) => t.status === "failed").length}
                </div>
                <div className="text-sm text-stone-600">Failed</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-stone-200/60">
                <div className="text-2xl font-semibold text-yellow-600">
                  {
                    tests.filter((t) =>
                      ["pending", "running"].includes(t.status)
                    ).length
                  }
                </div>
                <div className="text-sm text-stone-600">Pending/Running</div>
              </div>
            </div>
          )}

          {/* Tests List */}
          {!tests || tests.length === 0 ? (
            <div className="bg-stone-100/50 p-12 rounded-lg border border-stone-200/60 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-stone-200 rounded-full flex items-center justify-center">
                  <Play size={24} className="text-stone-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  No tests yet
                </h3>
                <p className="text-stone-600 mb-6">
                  Get started by creating your first Puppeteer test script using
                  natural language.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <TestItem key={test.id} test={test} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}