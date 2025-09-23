import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signout } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Home, ListVideo, Settings, LogOut } from "lucide-react";
import Image from "next/image";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-16 bg-stone-100/80 border-r border-stone-200 flex flex-col z-40">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-stone-200/60 flex justify-center">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-slate-800 hover:text-amber-800 transition-colors group relative"
          >
            <Image
              src="/tophat.png"
              alt="Tophat icon"
              width={30}
              height={30}
              className="object-contain"
            />
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              TopHat
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center justify-center w-12 h-12 text-stone-700 hover:text-slate-800 hover:bg-stone-200/60 rounded-lg transition-colors group relative"
              >
                <Home size={20} />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Dashboard
                </span>
              </Link>
            </li>

            <li>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-center w-12 h-12 text-stone-700 hover:text-slate-800 hover:bg-stone-200/60 rounded-lg transition-colors group relative"
              >
                <Settings size={20} />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Settings
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className="p-2 border-t border-stone-200/60">
          <form className="w-full">
            <Button
              type="submit"
              formAction={signout}
              variant="ghost"
              className="w-12 h-12 p-0 text-stone-600 hover:text-slate-800 hover:bg-stone-200/60 group relative"
            >
              <LogOut size={20} />
              <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Sign Out
              </span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content with left margin to account for fixed sidebar */}
      <main className="flex-1 ml-16">{children}</main>
    </div>
  );
}
