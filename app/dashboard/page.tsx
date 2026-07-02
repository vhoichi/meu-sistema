import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Dashboard from "./Dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const email = getSession();
  if (!email) {
    redirect("/");
  }
  return <Dashboard email={email} />;
}
