// page.tsx — Serve URL-controlled live dashboard data within a Suspense boundary.
import { redirect } from "next/navigation";
import { getIdentity } from "@/lib/api/session";
import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { PageLoader } from "@/components/shared/Loaders";
import { readDashboard } from "@/lib/api/dashboard";
import type { SearchValues } from "@/lib/dashboard-filters";
interface PageProps {
  searchParams: Promise<SearchValues>;
}
// Resolve request parameters on the server without sharing user data in a cache.
async function DashboardContent({ searchParams }: PageProps) {
  const user = await getIdentity();
  if (!user) redirect("/auth");
  const params = { ...(await searchParams), role: user.role };
  const { data, review, overdue } = await readDashboard(params);
  return (
    <Dashboard user={user} data={data} review={review} overdue={overdue} />
  );
}
// Keep request-bound URL reads under Suspense for Next.js Cache Components.
export default function HomePage(props: PageProps) {
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardContent {...props} />
    </Suspense>
  );
}
