import manifest from "../../scripts/assets.manifest.json";
import imageMeta from "../../scripts/generated/image-meta.json";
import videoMeta from "../../scripts/generated/video-meta.json";

export type AssetKey =
  | "heroPoster"
  | "heroTowers"
  | "developmentTowers"
  | "entranceStreet"
  | "lobbyWide"
  | "lobbyDetail"
  | "residenceLiving"
  | "livingRoom"
  | "balconySkyline"
  | "rooftopRise"
  | "rooftopPool"
  | "nightFacade"
  | "nightIlluminated";

type GeneratedEntry = {
  srcSetBase: string;
  widths: number[];
  formats: string[];
  width: number;
  height: number;
  blurDataURL: string;
};

const GENERATED = imageMeta as Record<string, GeneratedEntry>;

export type Asset = GeneratedEntry & {
  key: AssetKey;
  alt: string;
  priority: boolean;
};

function toAsset(entry: (typeof manifest.images)[number]): Asset {
  const generated = GENERATED[entry.key];

  if (!generated) {
    throw new Error(
      `Asset "${entry.key}" is in the manifest but was not generated. Run \`npm run assets:images\`.`,
    );
  }

  return {
    ...generated,
    key: entry.key as AssetKey,
    alt: entry.alt,
    priority: entry.priority === true,
  };
}

export const assets: Record<AssetKey, Asset> = Object.fromEntries(
  manifest.images.map((entry) => [entry.key, toAsset(entry)]),
) as Record<AssetKey, Asset>;

export const heroVideo = {
  webm: videoMeta.webm,
  mp4: videoMeta.mp4,
  poster: videoMeta.poster,
  width: videoMeta.width,
  height: videoMeta.height,
  alt: manifest.video.alt,
} as const;

/**
 * Critical first-viewport assets for the loading screen.
 *
 * `src` must point at a real generated file — these are fetched directly, not
 * through the image pipeline.
 */
export const criticalAssets: { src: string; weight: number }[] = [
  { src: `${assets.heroPoster.srcSetBase}-1376.webp`, weight: 4 },
  { src: `${assets.heroTowers.srcSetBase}-1376.webp`, weight: 2 },
  { src: `${assets.developmentTowers.srcSetBase}-1376.webp`, weight: 1 },
];

/** Static OG image — a real file on disk, since crawlers ignore srcset. */
export const ogImage = `${assets.heroPoster.srcSetBase}-1376.webp`;

/**
 * Ordered architectural walkthrough for the gallery. The key is typed so a
 * renamed asset fails the build rather than 404-ing at runtime.
 */
export const gallery: { key: AssetKey; caption: string }[] = [
  { key: "developmentTowers", caption: "Three towers, one silhouette" },
  { key: "entranceStreet", caption: "The threshold at street level" },
  { key: "lobbyWide", caption: "A double-height arrival lobby" },
  { key: "lobbyDetail", caption: "Board-formed concrete stair" },
  { key: "livingRoom", caption: "Living and dining as one room" },
  { key: "balconySkyline", caption: "Nairobi, framed floor to ceiling" },
  { key: "rooftopPool", caption: "The pool against the horizon" },
  { key: "nightIlluminated", caption: "The towers, illuminated" },
];

export const intrinsicSize = {
  width: manifest.width,
  height: manifest.height,
} as const;