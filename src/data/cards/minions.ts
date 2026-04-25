import type { CardDefinition } from "../../types.js";
import { GUARD_PACKAGE_MINIONS } from "./minions/guardPackage.js";
import { HIGH_COST_MINIONS } from "./minions/highCost.js";
import { LOW_COST_MINIONS } from "./minions/lowCost.js";
import { MID_COST_MINIONS } from "./minions/midCost.js";
import { SIDEBOARD_FINISHER_MINIONS } from "./minions/sideboardFinishers.js";

export { LOW_COST_MINIONS } from "./minions/lowCost.js";
export { MID_COST_MINIONS } from "./minions/midCost.js";
export { HIGH_COST_MINIONS } from "./minions/highCost.js";
export { GUARD_PACKAGE_MINIONS } from "./minions/guardPackage.js";
export { SIDEBOARD_FINISHER_MINIONS } from "./minions/sideboardFinishers.js";

export const MINION_CARDS: CardDefinition[] = [
  ...LOW_COST_MINIONS,
  ...MID_COST_MINIONS,
  ...HIGH_COST_MINIONS,
  ...GUARD_PACKAGE_MINIONS,
  ...SIDEBOARD_FINISHER_MINIONS
];
