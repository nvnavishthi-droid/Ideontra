// page.tsx — Request-bound employee authentication on the second page route.
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { PageLoader } from "@/components/shared/Loaders";
import { getIdentity } from "@/lib/api/session";
// Redirect verified employees without email-confirmation states.
async function AuthContent() {
  const user = await getIdentity();
  if (user) redirect("/");
  return <AuthForm />;
}
// Keep request-bound authentication reads beneath Suspense.
export default function AuthPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthContent />
    </Suspense>
  );
}
