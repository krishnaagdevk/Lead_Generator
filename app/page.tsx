import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";

export default async function RootPage() {
  const session = await getSession();
  if (session) redirect("/search");
  redirect("/login");
}
