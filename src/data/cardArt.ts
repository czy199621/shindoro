import type { CardDefinition } from "../types.js";

const CARD_ART_BASE_PATH = "/cards";

export function getCardArtPath(cardId: string): string {
  return `${CARD_ART_BASE_PATH}/${cardId}.jpg`;
}

export function attachCardArt(card: CardDefinition): CardDefinition {
  return {
    ...card,
    art: card.art ?? getCardArtPath(card.id)
  };
}
