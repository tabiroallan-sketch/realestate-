import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SOURCE = path.join(ROOT, "src", "journey", "waypoints.ts");

const WAYPOINT_RE =
  /id:\s*"([^"]+)",\s*position:\s*\[\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\],[\s\S]*?fov:\s*([\d.]+),\s*t:\s*([\d.]+)/g;

export async function loadWaypoints() {
  const source = await readFile(SOURCE, "utf8");
  return [...source.matchAll(WAYPOINT_RE)].map((match) => ({
    id: match[1],
    t: Number(match[6]),
  }));
}
