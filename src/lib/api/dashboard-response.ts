// dashboard-response.ts — Private HTTP reads through existing authenticated RPCs.
import "server-only";
import { readDashboard } from "./dashboard";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
// Normalize URL state on the server and return handled failures without caching identity.
export async function dashboardResponse(request: Request): Promise<Response> {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    return Response.json(await readDashboard(params), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load ideas.";
    return Response.json({ error: message }, {
      status: message === "Please sign in again." ? 401 : 500, headers,
    });
  }
}
