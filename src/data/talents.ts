import type { TalentDefinition, TalentSeat } from "../types.js";
import { SURVIVAL_TALENTS } from "./talents/survival.js";
import { RESOURCE_TALENTS } from "./talents/resource.js";
import { DECK_CONTROL_TALENTS } from "./talents/deckControl.js";
import { COMBAT_TALENTS } from "./talents/combat.js";
import { SPELL_TALENTS } from "./talents/spell.js";
import { BURST_TALENTS } from "./talents/burst.js";
import { SLOT_CONTROL_TALENTS } from "./talents/slotControl.js";

export { SURVIVAL_TALENTS } from "./talents/survival.js";
export { RESOURCE_TALENTS } from "./talents/resource.js";
export { DECK_CONTROL_TALENTS } from "./talents/deckControl.js";
export { COMBAT_TALENTS } from "./talents/combat.js";
export { SPELL_TALENTS } from "./talents/spell.js";
export { BURST_TALENTS } from "./talents/burst.js";
export { SLOT_CONTROL_TALENTS } from "./talents/slotControl.js";

export const TALENTS: TalentDefinition[] = [
  ...SURVIVAL_TALENTS,
  ...RESOURCE_TALENTS,
  ...DECK_CONTROL_TALENTS,
  ...COMBAT_TALENTS,
  ...SPELL_TALENTS,
  ...BURST_TALENTS,
  ...SLOT_CONTROL_TALENTS
];

export const TALENT_LOOKUP: Record<string, TalentDefinition> = Object.fromEntries(
  TALENTS.map((talent) => [talent.id, talent])
) as Record<string, TalentDefinition>;

export function getTalentCost(talent: TalentDefinition, seat: TalentSeat): number | null {
  return seat === "first" ? talent.pricing.first : talent.pricing.second;
}

export function isTalentAvailableForSeat(talent: TalentDefinition, seat: TalentSeat): boolean {
  return getTalentCost(talent, seat) !== null;
}
