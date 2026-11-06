// route.ts — Serve private dashboard results without rebuilding the page shell.
import { dashboardResponse } from "@/lib/api/dashboard-response";
// Read URL filters using the same identity verification as initial page rendering.
export async function GET(request: Request): Promise<Response> {
  return dashboardResponse(request);
}
