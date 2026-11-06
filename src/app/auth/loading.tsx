// loading.tsx — Match the sign-in card while authentication route data loads.
import { PageLoader } from "@/components/shared/Loaders";
// Reuse the central loader with the authentication silhouette.
export default function Loading() {
  return <PageLoader variant="auth" />;
}
