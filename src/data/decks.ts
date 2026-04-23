import type { DeckConfig } from "../types.js";

function copies(cardId: string, count: number): string[] {
  return Array.from({ length: count }, () => cardId);
}

function validateDeck(mainDeck: string[]): void {
  if (mainDeck.length !== 50) {
    throw new Error(`Deck must contain 50 cards, received ${mainDeck.length}.`);
  }

  const counts = new Map<string, number>();
  for (const cardId of mainDeck) {
    const next = (counts.get(cardId) ?? 0) + 1;
    if (next > 3) {
      throw new Error(`Deck cannot contain more than 3 copies of ${cardId}.`);
    }
    counts.set(cardId, next);
  }
}

function defineDeck(mainDeck: string[], sideboard: string[]): DeckConfig {
  validateDeck(mainDeck);
  return { mainDeck, sideboard };
}

export const STARTING_DECKS: Record<string, DeckConfig> = {
  character_a: defineDeck(
    [
      ...copies("ember_wolf", 3),
      ...copies("burn", 3),
      ...copies("tactical_insight", 3),
      ...copies("blade_dancer", 3),
      ...copies("ashen_ranger", 3),
      ...copies("battlefield_bard", 3),
      ...copies("storm_lancer", 3),
      ...copies("tactics_scroll", 3),
      ...copies("arc_bolt", 3),
      ...copies("war_banner", 3),
      ...copies("novice_mage", 3),
      ...copies("shrine_guard", 3),
      ...copies("dusk_assassin", 3),
      ...copies("grave_knight", 3),
      ...copies("mirror_wall", 3),
      ...copies("cinder_storm", 2),
      ...copies("inspiration", 2),
      "iron_colossus"
    ],
    ["divine_intervention", "judgment_beam", "miracle_guardian"]
  ),
  character_b: defineDeck(
    [
      ...copies("shrine_guard", 3),
      ...copies("shield_doll", 3),
      ...copies("dawn_healer", 3),
      ...copies("novice_mage", 3),
      ...copies("archivist_owl", 3),
      ...copies("mirror_sage", 3),
      ...copies("pact_weaver", 3),
      ...copies("underdog_shrine", 3),
      ...copies("sage_archive", 3),
      ...copies("healing_prayer", 3),
      ...copies("arc_bolt", 3),
      ...copies("soul_shatter", 3),
      ...copies("cinder_storm", 3),
      ...copies("desperate_gamble", 3),
      ...copies("mirror_wall", 3),
      ...copies("grave_knight", 2),
      ...copies("divine_intervention", 3)
    ],
    ["judgment_beam", "miracle_guardian", "ambush_sigil"]
  ),
  character_c: defineDeck(
    [
      ...copies("ember_wolf", 3),
      ...copies("burn", 3),
      ...copies("tactical_insight", 3),
      ...copies("novice_mage", 3),
      ...copies("blade_dancer", 3),
      ...copies("battlefield_bard", 3),
      ...copies("storm_lancer", 3),
      ...copies("ashen_ranger", 3),
      ...copies("tactics_scroll", 3),
      ...copies("war_banner", 3),
      ...copies("grave_knight", 3),
      ...copies("iron_colossus", 3),
      ...copies("shield_doll", 3),
      ...copies("dusk_assassin", 3),
      ...copies("ambush_sigil", 3),
      ...copies("mirror_wall", 3),
      ...copies("inspiration", 2)
    ],
    ["divine_intervention", "judgment_beam", "miracle_guardian"]
  ),
  character_d: defineDeck(
    [
      ...copies("shrine_guard", 3),
      ...copies("shield_doll", 3),
      ...copies("novice_mage", 3),
      ...copies("dusk_assassin", 3),
      ...copies("soul_shatter", 3),
      ...copies("arc_bolt", 3),
      ...copies("grave_knight", 3),
      ...copies("iron_colossus", 3),
      ...copies("mirror_sage", 3),
      ...copies("pact_weaver", 3),
      ...copies("war_banner", 3),
      ...copies("cinder_storm", 3),
      ...copies("tactical_insight", 3),
      ...copies("ambush_sigil", 3),
      ...copies("mirror_wall", 3),
      ...copies("burn", 3),
      ...copies("ashen_ranger", 2)
    ],
    ["judgment_beam", "miracle_guardian", "divine_intervention"]
  ),
  character_e: defineDeck(
    [
      ...copies("ember_wolf", 3),
      ...copies("burn", 3),
      ...copies("shrine_guard", 3),
      ...copies("blade_dancer", 3),
      ...copies("ashen_ranger", 3),
      ...copies("tactical_insight", 3),
      ...copies("desperate_gamble", 3),
      ...copies("storm_lancer", 3),
      ...copies("battlefield_bard", 3),
      ...copies("mirror_wall", 3),
      ...copies("ambush_sigil", 3),
      ...copies("grave_knight", 3),
      ...copies("dawn_healer", 3),
      ...copies("arc_bolt", 3),
      ...copies("cinder_storm", 3),
      ...copies("novice_mage", 3),
      ...copies("war_banner", 2)
    ],
    ["judgment_beam", "divine_intervention", "miracle_guardian"]
  ),
  character_f: defineDeck(
    [
      ...copies("novice_mage", 3),
      ...copies("archivist_owl", 3),
      ...copies("mirror_sage", 3),
      ...copies("sage_archive", 3),
      ...copies("underdog_shrine", 3),
      ...copies("mirror_wall", 3),
      ...copies("ambush_sigil", 3),
      ...copies("desperate_gamble", 3),
      ...copies("inspiration", 3),
      ...copies("healing_prayer", 3),
      ...copies("soul_shatter", 3),
      ...copies("cinder_storm", 3),
      ...copies("dawn_healer", 3),
      ...copies("shield_doll", 3),
      ...copies("pact_weaver", 3),
      ...copies("judgment_beam", 3),
      ...copies("divine_intervention", 2)
    ],
    ["miracle_guardian", "judgment_beam", "divine_intervention"]
  )
};
