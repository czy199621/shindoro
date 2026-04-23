import type {
  AdvantageBreakdown,
  CardDefinition,
  DeckChoice,
  MinionInstance,
  PersistentInstance,
  PlayerId,
  PlayerState,
  RuntimeCard,
  SlotType
} from "../types.js";

let runtimeCounter = 0;

export function createRuntimeId(prefix = "id"): string {
  runtimeCounter += 1;
  return `${prefix}_${runtimeCounter}`;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createRuntimeCard(cardDefinition: CardDefinition): RuntimeCard {
  return {
    ...structuredClone(cardDefinition),
    runtimeId: createRuntimeId(cardDefinition.type),
    baseCost: cardDefinition.cost,
    currentCost: cardDefinition.cost
  };
}

export function createMinionInstance(card: CardDefinition | RuntimeCard, ownerId: PlayerId): MinionInstance {
  return {
    instanceId: createRuntimeId("minion"),
    ownerId,
    sourceCardId: card.id,
    name: card.name,
    attack: card.attack ?? 0,
    health: card.health ?? 0,
    maxHealth: card.health ?? 0,
    threat: card.threat ?? defaultThreatForStats(card.attack ?? 0, card.health ?? 0),
    description: card.description,
    tags: [...(card.tags ?? [])],
    effects: structuredClone(card.effects ?? []),
    canAttack: (card.tags ?? []).includes("rush"),
    summonedThisTurn: true
  };
}

export function createPersistentInstance(
  card: CardDefinition | RuntimeCard,
  ownerId: PlayerId
): PersistentInstance {
  return {
    instanceId: createRuntimeId(card.type),
    ownerId,
    sourceCardId: card.id,
    name: card.name,
    threat: card.threat ?? 0,
    description: card.description,
    effects: structuredClone(card.effects ?? []),
    type: card.type as PersistentInstance["type"]
  };
}

export function defaultThreatForStats(attack: number, health: number): number {
  return Math.floor(attack + health / 2);
}

export function boardAttack(player: Pick<PlayerState, "board">): number {
  return player.board.reduce((sum, minion) => sum + Math.max(0, minion.attack), 0);
}

function getSuppressedThreat(baseThreat: number, suppressorCount: number): number {
  let threat = baseThreat;
  for (let index = 0; index < suppressorCount; index += 1) {
    threat = Math.floor(threat / 2);
  }
  return threat;
}

export function boardThreat(
  player: Pick<PlayerState, "board" | "persistents">,
  opponent: Pick<PlayerState, "board"> = { board: [] }
): number {
  const suppressorCount = opponent.board.filter((minion) => (minion.tags ?? []).includes("menace")).length;
  const minionThreat = player.board.reduce(
    (sum, minion) =>
      sum +
      getSuppressedThreat(minion.threat ?? defaultThreatForStats(minion.attack, minion.health), suppressorCount),
    0
  );
  const persistentThreat = player.persistents.reduce((sum, card) => sum + (card.threat ?? 0), 0);
  return minionThreat + persistentThreat;
}

export function getAdvantageBreakdown(
  me: Pick<PlayerState, "hp" | "hand" | "deck" | "board" | "persistents">,
  opp: Pick<PlayerState, "hp" | "hand" | "deck" | "board" | "persistents">
): AdvantageBreakdown {
  let handScore = me.hand.length - opp.hand.length;
  if (me.hand.length > 7 || opp.hand.length > 7) {
    handScore *= 2;
  }

  const hpDiff = me.hp - opp.hp;
  const hpScore =
    Math.abs(hpDiff) > 4 ? Math.sign(hpDiff) * Math.floor((Math.abs(hpDiff) - 4) / 4 + 1) : 0;

  const threatScore = boardThreat(me, opp) - boardThreat(opp, me);

  let specialScore = 0;
  const details: string[] = [];
  if (me.deck.length <= 5) {
    specialScore -= 2;
    details.push("牌库见底 -2");
  }
  if (me.hp < boardAttack(opp)) {
    specialScore -= 3;
    details.push("处于斩杀线 -3");
  }

  return {
    handScore,
    hpScore,
    threatScore,
    specialScore,
    details,
    total: handScore + hpScore + threatScore + specialScore
  };
}

export function calculateAdvantage(
  me: Pick<PlayerState, "hp" | "hand" | "deck" | "board" | "persistents">,
  opp: Pick<PlayerState, "hp" | "hand" | "deck" | "board" | "persistents">
): number {
  return getAdvantageBreakdown(me, opp).total;
}

export function getSlotGain(value: number): number {
  const abs = Math.abs(value);
  if (abs === 0) return 0;
  if (abs <= 3) return 1;
  if (abs <= 6) return 2;
  return 3;
}

export function groupDeckChoices(deck: Array<{ id: string }>): DeckChoice[] {
  const counts = new Map<string, number>();
  for (const card of deck) {
    counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
  }
  return [...counts.entries()].map(([cardId, count]) => ({ cardId, count }));
}

export function removeFirstMatching<T>(items: T[], predicate: (item: T) => boolean): T | null {
  const index = items.findIndex(predicate);
  if (index < 0) return null;
  return items.splice(index, 1)[0] ?? null;
}

export function createEmptyPlayerState(playerId: PlayerId, characterId: string): PlayerState {
  return {
    id: playerId,
    character: characterId,
    hp: 20,
    maxHp: 20,
    handLimit: 7,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    board: [],
    persistents: [],
    traps: [],
    reserveDeck: [],
    graveyard: [],
    jumpSlot: 0,
    godDrawSlot: 0,
    selectedTalents: [],
    temporaryFlags: {
      nextDrawDiscount: 0,
      slotGainModifier: { jump: 0, godDraw: 0 } as Record<SlotType, number>,
      openingBonusDraw: 0,
      openingBonusMana: 0,
      openingSlotBonus: { jump: 0, godDraw: 0 } as Record<SlotType, number>,
      lowCostRushMaxCost: null,
      highCostMinionDiscount: null,
      loneMinionGuard: false,
      spellDamageBonus: 0,
      lowHpTurnStartHeal: null,
      preserveBurstSlotAmount: 0,
      nextTurnManaPenalty: 0,
      ignoreGuardThisTurn: false,
      millOnDamageTaken: 0,
      damageTakenThisTurn: 0
    }
  };
}
