import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect("/");
  }

  return (
    <Dashboard
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
      }}
    />
  );
}
