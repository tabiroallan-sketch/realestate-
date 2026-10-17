import { locationPoints } from "@/data/site";

const SIZE = 460;
const CENTER = SIZE / 2;
const MAX_R = 190;
const MAX_MINUTES = 40;
const RINGS = [10, 20, 30, 40];

const rad = (deg: number) => (deg * Math.PI) / 180;

function point(minutes: number, angle: number) {
  const r = (Math.min(minutes, MAX_MINUTES) / MAX_MINUTES) * MAX_R;
  return {
    x: CENTER + r * Math.sin(rad(angle)),
    y: CENTER - r * Math.cos(rad(angle)),
    r,
  };
}

/**
 * Schematic distance rose — a labelled radial bearing chart, not a map.
 *
 * Radius is scaled linearly to minutes so a point sits exactly between the
 * rings it is near, and bearing is the real compass direction. Deliberately
 * drawn as an SVG rather than embedding a tile map: it needs no network, reads
 * on the dark surface, and stays honest about being illustrative.
 */
export function DistanceRose() {
  return (
    <figure className="mx-auto w-full max-w-[34rem]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-labelledby="rose-title rose-desc"
        className="w-full text-ivory-dim"
      >
        <title id="rose-title">Driving times from The Verde Residences</title>
        <desc id="rose-desc">
          Schematic chart: {locationPoints.map((p) => `${p.label} ${p.note}`).join(", ")}.
        </desc>

        {RINGS.map((ring) => {
          const r = (ring / MAX_MINUTES) * MAX_R;
          return (
            <g key={ring}>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.22}
                strokeWidth={1}
              />
              <text
                x={CENTER + 4}
                y={CENTER - r + 14}
                className="numeral"
                fill="currentColor"
                fillOpacity={0.5}
              >
                {ring} min
              </text>
            </g>
          );
        })}

        <line
          x1={CENTER}
          y1={CENTER - MAX_R}
          x2={CENTER}
          y2={CENTER + MAX_R}
          stroke="currentColor"
          strokeOpacity={0.12}
        />
        <line
          x1={CENTER - MAX_R}
          y1={CENTER}
          x2={CENTER + MAX_R}
          y2={CENTER}
          stroke="currentColor"
          strokeOpacity={0.12}
        />

        {locationPoints.map((p) => {
          const { x, y } = point(p.minutes, p.angle);
          const label = point(p.minutes + (p.minutes > 20 ? 2.2 : 4.2), p.angle);
          const anchor = Math.cos(rad(p.angle)) > 0.2 ? "start" : Math.cos(rad(p.angle)) < -0.2 ? "end" : "middle";
          return (
            <g key={p.label}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="var(--color-bronze)"
                strokeOpacity={0.35}
              />
              <circle cx={x} cy={y} r={4} fill="var(--color-bronze)" />
              <text x={label.x} y={label.y} textAnchor={anchor} className="numeral" fill="var(--color-ivory)">
                {p.label}
              </text>
              <text
                x={label.x}
                y={label.y + 14}
                textAnchor={anchor}
                className="numeral"
                fill="var(--color-bronze)"
              >
                {p.note}
              </text>
            </g>
          );
        })}

        <circle cx={CENTER} cy={CENTER} r={5} fill="var(--color-ivory)" />
        <text
          x={CENTER}
          y={CENTER - 14}
          textAnchor="middle"
          className="numeral"
          fill="var(--color-ivory-dim)"
        >
          The Verde
        </text>
      </svg>

      <figcaption className="caption mt-4 text-center text-ivory-faint">
        Schematic, not to scale — driving times are indicative.
      </figcaption>
    </figure>
  );
}
