import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { DocumentationManager } from "./DocumentationManager";

export default async function AdminDocumentationPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
    redirect("/schedule");
  }

  const initialEntries = await prisma.documentation_entries.findMany({
    orderBy: {
      topic: "asc",
    },
  });

  return (
    <div className="p-4 md:p-8">
      <DocumentationManager initialEntries={initialEntries} />
    </div>
  );
}
