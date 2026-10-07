import type { AssetKey } from "@/data/assets";

export type Beat = {
  id: string;
  assetKey: AssetKey;
  depth: number;
  label: string;
};

export const BEATS: readonly Beat[] = [
  { id: "arrival", assetKey: "heroPoster", depth: 90, label: "Arrival" },
  { id: "towers", assetKey: "heroTowers", depth: 90, label: "The Towers" },
  { id: "development", assetKey: "developmentTowers", depth: 90, label: "Development View" },
  { id: "threshold", assetKey: "entranceStreet", depth: 70, label: "Threshold" },
  { id: "lobby", assetKey: "lobbyWide", depth: 130, label: "Lobby" },
  { id: "lobby-detail", assetKey: "lobbyDetail", depth: 130, label: "Lobby Detail" },
  { id: "residence", assetKey: "residenceLiving", depth: 130, label: "Residence Interior" },
  { id: "living", assetKey: "livingRoom", depth: 130, label: "Living Room" },
  { id: "view", assetKey: "balconySkyline", depth: 90, label: "The View" },
  { id: "rooftop-rise", assetKey: "rooftopRise", depth: 90, label: "Rooftop Rise" },
  { id: "rooftop-pool", assetKey: "rooftopPool", depth: 90, label: "Rooftop Pool" },
  { id: "night-facade", assetKey: "nightFacade", depth: 90, label: "Night Facade" },
  { id: "night", assetKey: "nightIlluminated", depth: 90, label: "Night" },
];
