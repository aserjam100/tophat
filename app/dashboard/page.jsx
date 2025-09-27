import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Calendar,
} from "lucide-react";

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    pending: {
      icon: Clock,
      variant: "secondary",
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    },
    running: {
      icon: Play,
      variant: "secondary",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    },
    passed: {
      icon: CheckCircle,
      variant: "secondary",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
    failed: {
      icon: XCircle,
      variant: "secondary",
      className: "bg-red-100 text-red-800 hover:bg-red-100",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon size={12} className="mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

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
                <Button asChild className="bg-slate-800 hover:bg-slate-700">
                  <Link href="/dashboard/tests/new">
                    <Plus size={16} className="mr-2" />
                    Create Your First Test
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white p-6 rounded-lg border border-stone-200/60 hover:border-stone-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Test Name and Status */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-slate-800">
                          {test.name}
                        </h3>
                        <StatusBadge status={test.status} />
                      </div>

                      {/* Description */}
                      {test.description && (
                        <p className="text-stone-600 mb-3 text-sm">
                          {test.description}
                        </p>
                      )}

                      {/* Instructions Preview */}
                      <p className="text-stone-500 text-xs mb-4 line-clamp-2">
                        Instructions: {test.instructions}
                      </p>

                      {/* Meta Information */}
                      <div className="flex items-center gap-6 text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{formatDate(test.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-stone-600 hover:text-slate-800"
                      >
                        <Link href={`/dashboard/tests/${test.id}`}>
                          <Eye size={14} className="mr-1" />
                          View
                        </Link>
                      </Button>
                      {test.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <Play size={14} className="mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}