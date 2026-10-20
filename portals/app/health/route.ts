// Used by the compose healthcheck (docker-compose.yml, service "portals").
export const dynamic = "force-static";

export function GET() {
  return Response.json({ status: "ok" });
}
