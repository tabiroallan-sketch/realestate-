/**
 * Analytics collector.
 *
 * A beacon sink, deliberately minimal: it accepts a JSON event and returns 204.
 * Swap the body for a real provider (Segment, Plausible, a warehouse endpoint)
 * without touching the client — `src/lib/analytics.ts` only knows this URL.
 */
export async function POST(request: Request) {
  try {
    const event: unknown = await request.json();
    if (process.env.NODE_ENV !== "production") {
      console.log("[analytics]", JSON.stringify(event));
    }
  } catch {
    // Malformed beacons are dropped; telemetry must never throw.
  }

  return new Response(null, { status: 204 });
}
