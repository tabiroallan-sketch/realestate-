/**
 * First-party, dependency-free analytics.
 *
 * Events are beacons posted to `/api/analytics`, which is where a real provider
 * would be wired. Nothing here is allowed to throw or block the page.
 */
export type AnalyticsProps = Record<string, string | number | boolean>;

export function track(name: string, props: AnalyticsProps = {}): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    name,
    props,
    path: window.location.pathname,
    ts: Date.now(),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics",
        new Blob([payload], { type: "application/json" }),
      );
      return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      body: payload,
      keepalive: true,
      headers: { "content-type": "application/json" },
    });
  } catch {
    // Telemetry must never break the experience.
  }
}
