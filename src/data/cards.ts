import type { CardDefinition } from "../types.js";
import { attachCardArt } from "./cardArt.js";
import { MINION_CARDS as RAW_MINION_CARDS } from "./cards/minions.js";
import { SPELL_CARDS as RAW_SPELL_CARDS } from "./cards/spells.js";
import { PERSISTENT_CARDS as RAW_PERSISTENT_CARDS } from "./cards/persistents.js";
import { TRAP_CARDS as RAW_TRAP_CARDS } from "./cards/traps.js";

export const MINION_CARDS: CardDefinition[] = RAW_MINION_CARDS.map(attachCardArt);
export const SPELL_CARDS: CardDefinition[] = RAW_SPELL_CARDS.map(attachCardArt);
export const PERSISTENT_CARDS: CardDefinition[] = RAW_PERSISTENT_CARDS.map(attachCardArt);
export const TRAP_CARDS: CardDefinition[] = RAW_TRAP_CARDS.map(attachCardArt);

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
