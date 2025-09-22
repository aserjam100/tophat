import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { signout } from "@/app/actions";

export default async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = !!data?.user;

  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-medium text-slate-800 hover:text-amber-800 transition-colors"
        >
          Tophat
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <form>
              <Button
                type="submit"
                formAction={signout}
                variant="ghost"
                className="text-stone-600 hover:text-slate-800 hover:bg-stone-100"
              >
                Sign Out
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-stone-600 hover:text-slate-800 hover:bg-stone-100"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-slate-800 hover:bg-slate-700 text-stone-50 shadow-sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
