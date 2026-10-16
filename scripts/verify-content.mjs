/**
 * Content data gate.
 *
 * The availability table, trust figures and section copy are consumed by later
 * tasks as byte-exact interfaces, so this checks them against the architecture
 * and typology data they must stay consistent with — plus the WhatsApp link,
 * every chapter/CTA anchor target, and the hero CTA shape.
 *
 *   node scripts/verify-content.mjs
 */
import {
  site,
  sections,
  architecture,
  residenceTypes,
  availability,
  trust,
  hero,
  flight,
} from "../src/data/site.ts";
import { BEATS } from "../src/data/beats.ts";
import { chapters, navigation, navigationCta } from "../src/data/navigation.ts";

const failures = [];
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures.push(label);
};

check(
  "availability totals match architecture",
  availability.total === architecture.residences &&
    availability.remaining === 37 &&
    availability.remaining < availability.total &&
    availability.asOf === "October 2026",
  `total ${availability.total}, remaining ${availability.remaining}, as of ${availability.asOf}`,
);

check(
  "availability has 5-8 rows",
  availability.rows.length >= 5 && availability.rows.length <= 8,
  `${availability.rows.length} rows`,
);

const typeById = new Map(residenceTypes.map((type) => [type.id, type]));
const rowProblems = [];
for (const row of availability.rows) {
  if (!Number.isInteger(row.floor) || row.floor < 1 || row.floor > architecture.storeys) {
    rowProblems.push(`${row.unit} floor ${row.floor} outside 1..${architecture.storeys}`);
  }
  const type = typeById.get(row.type);
  if (!type) {
    rowProblems.push(`${row.unit} type "${row.type}" is not a residence type`);
  } else {
    if (row.size !== type.interior) {
      rowProblems.push(`${row.unit} size ${row.size} != typology interior ${type.interior}`);
    }
    const floorPrice = Number.parseFloat(/[\d.]+/.exec(type.range)?.[0] ?? "NaN");
    if (!(row.priceValue >= floorPrice)) {
      rowProblems.push(`${row.unit} priceValue ${row.priceValue} below range ${floorPrice}`);
    }
  }
  if (!["Available", "On hold"].includes(row.status)) {
    rowProblems.push(`${row.unit} status "${row.status}" outside Available/On hold`);
  }
  if (!row.price.startsWith("KES ")) {
    rowProblems.push(`${row.unit} price "${row.price}" does not start with "KES "`);
  }
}
check(
  "rows respect floors, typologies, ranges and statuses",
  rowProblems.length === 0,
  rowProblems.join("; "),
);

check(
  "trust figures consistent",
  trust.founded <= 2026 && trust.homes === 1240 && trust.towersUnderConstruction === 6,
  `founded ${trust.founded}, homes ${trust.homes}, towers ${trust.towersUnderConstruction}`,
);

check(
  "whatsapp base and hours",
  /^https:\/\/wa\.me\/254\d{9}$/.test(site.whatsappBase) && site.hours.includes("09:00"),
  `${site.whatsappBase}, ${site.hours}`,
);

const anchorIds = new Set([...Object.values(sections).map((section) => section.id), "hero"]);
const targets = new Set();
for (const chapter of chapters) targets.add(chapter.id);
for (const item of navigation) if (item.href.startsWith("#")) targets.add(item.href.slice(1));
if (navigationCta.href.startsWith("#")) targets.add(navigationCta.href.slice(1));
for (const cta of [hero.primaryCta, hero.secondaryCta]) {
  if (cta?.href?.startsWith("#")) targets.add(cta.href.slice(1));
}
const missing = [...targets].filter((target) => !anchorIds.has(target));
check(
  "every chapter and CTA target resolves to a section id",
  missing.length === 0,
  missing.map((target) => `#${target}`).join(", "),
);

check(
  "hero secondary CTA present",
  Boolean(hero.secondaryCta?.href),
  hero.secondaryCta ? hero.secondaryCta.href : "undefined",
);

check(
  "flight chapters align with beats",
  flight.chapters.length === BEATS.length &&
    BEATS.every((beat, index) => flight.chapters[index].id === beat.id) &&
    flight.chapters.every((chapter) => chapter.title && chapter.line),
  `${flight.chapters.length} chapters for ${BEATS.length} beats`,
);

const bodyIssues = flight.chapters
  .filter(
    (chapter) =>
      !chapter.body ||
      chapter.body.length <= chapter.line.length ||
      chapter.body.length > 320,
  )
  .map((chapter) => `${chapter.id}:${chapter.body ? chapter.body.length : 0}`);
check(
  "flight chapter paragraphs present and within bounds",
  bodyIssues.length === 0,
  bodyIssues.length ? bodyIssues.join(", ") : `${flight.chapters.length} paragraphs`,
);

console.log("");
if (failures.length) {
  console.log(`${failures.length} FAILED: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("content data green");
