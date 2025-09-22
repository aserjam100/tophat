import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signout } from "./actions";
import { Button } from "@/components/ui/button";

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <form>
          <Button type="submit" formAction={signout} variant="outline">
            Logout
          </Button>
        </form>
      </div>
      <p>Hello {data.user.email}</p>
    </div>
  );
}
