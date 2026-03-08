import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.id)) {
    redirect("/");
  }

  return (
    <div className="min-h-[60vh]">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-2xl">🛠️</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Admin Dashboard
        </h1>
      </div>
      {children}
    </div>
  );
}
