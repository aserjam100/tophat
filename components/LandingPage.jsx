import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

import Header from "@/components/Header";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = !!data?.user;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="container mx-auto px-4 py-4">
        {/* Hero Section */}
        <div className="text-center mb-8 max-w-4xl mx-auto">
          <h1 className="text-6xl font-light text-slate-800 mb-8 leading-tight">
            Test Your Web Apps with{" "}
            <span className="text-amber-800 font-normal">Natural Language</span>
          </h1>
          <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Generate and execute automated Puppeteer tests by simply describing
            what you want to test. Perfect for product managers and
            non-technical teams.
          </p>

          <div className="flex justify-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-slate-800 hover:bg-slate-700 text-stone-50 px-8 py-3 text-base font-medium shadow-sm"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-slate-800 hover:bg-slate-700 text-stone-50 px-8 py-3 text-base font-medium shadow-sm"
                  >
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-stone-700 hover:text-slate-800 hover:bg-stone-100 border border-stone-300 px-8 py-3 text-base font-medium"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-5 max-w-5xl mx-auto">
          <h2 className="text-2xl font-light text-slate-800 mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center bg-stone-100/50 p-8 rounded-lg border border-stone-200/60">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-sm font-medium mb-6 shadow-sm">
                01
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">
                Describe Your Test
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Tell us what you want to test using natural language or voice
                input
              </p>
            </div>

            <div className="flex flex-col items-center bg-stone-100/50 p-8 rounded-lg border border-stone-200/60">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-sm font-medium mb-6 shadow-sm">
                02
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">
                AI Generates Tests
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Our AI creates Puppeteer test scripts based on your requirements
              </p>
            </div>

            <div className="flex flex-col items-center bg-stone-100/50 p-8 rounded-lg border border-stone-200/60">
              <div className="w-10 h-10 bg-slate-200 text-slate-800 rounded-full flex items-center justify-center text-sm font-medium mb-6 shadow-sm">
                03
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-3">
                Get Results
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                View detailed reports with screenshots and pass/fail status
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-100/30 py-12 mt-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-stone-500 text-sm">
            © 2025 Tophat. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
