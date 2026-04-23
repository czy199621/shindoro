import type { CardDefinition } from "../types.js";
import { MINION_CARDS } from "./cards/minions.js";
import { SPELL_CARDS } from "./cards/spells.js";
import { PERSISTENT_CARDS } from "./cards/persistents.js";
import { TRAP_CARDS } from "./cards/traps.js";

export { MINION_CARDS } from "./cards/minions.js";
export { SPELL_CARDS } from "./cards/spells.js";
export { PERSISTENT_CARDS } from "./cards/persistents.js";
export { TRAP_CARDS } from "./cards/traps.js";

export const CARD_LIBRARY: CardDefinition[] = [
  ...MINION_CARDS,
  ...SPELL_CARDS,
  ...PERSISTENT_CARDS,
  ...TRAP_CARDS
];

export const CARD_LOOKUP: Record<string, CardDefinition> = Object.fromEntries(
  CARD_LIBRARY.map((card) => [card.id, card])
) as Record<string, CardDefinition>;

export function getCardDefinition(cardId: string): CardDefinition {
  const card = CARD_LOOKUP[cardId];
  if (!card) {
    throw new Error(`Unknown card id: ${cardId}`);
  }
  return card;
}
