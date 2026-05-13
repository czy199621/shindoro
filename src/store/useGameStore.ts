import { CARD_LIBRARY, getCardDefinition } from "../data/cards.js";
import { CHARACTERS } from "../data/characters.js";
import { STARTING_DECKS } from "../data/decks.js";
import {
  DECK_STORAGE_KEY,
  getConstructibleCards,
  isConstructibleCard,
  validateMainDeck
} from "../data/deckValidation.js";
import { TALENTS, getTalentCost, isTalentAvailableForSeat } from "../data/talents.js";
import { ShinDoroGame } from "../engine/gameState.js";
import type {
  CardDefinition,
  CardType,
  CharacterDefinition,
  DeckValidationResult,
  GameState,
  PendingChoicePayload,
  PlayerId,
  SavedDeck,
  SavedDeckCollection,
  TalentDefinition
} from "../types.js";

const PLAYER_TALENT_SEAT = "first" as const;
const AI_ACTION_DELAY_MS = 520;
const ATTACK_RESOLVE_DELAY_MS = 140;
const ATTACK_FX_TAIL_MS = 220;
const CARD_FX_DURATION_MS = 620;
const DEFAULT_DECK_ID = "default";

type DeckFilter = "all" | CardType | "cost_1" | "cost_2" | "cost_3" | "cost_4" | "cost_5" | "cost_6" | "cost_7_plus" | "guard" | "rush" | "battlecry" | "deathrattle";

export interface AttackFxState {
  attackerId: string;
  targetId: string;
  targetType: "minion" | "hero";
}

export interface CardFxState {
  id: string;
  kind: "summonMinion" | "placePersistent" | "placeTrap" | "spellCast" | "trapTrigger";
  ownerId: PlayerId;
  cardName: string;
  targetId: string | null;
}

interface VisualSnapshot {
  players: Record<
    PlayerId,
    {
      boardIds: Set<string>;
      persistentIds: Set<string>;
      trapIds: Set<string>;
      graveyardIds: Set<string>;
    }
  >;
}

function createDeckId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && "randomUUID" in cryptoApi) {
    return cryptoApi.randomUUID();
  }
  return `deck_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function canUseLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function normalizeSavedDeck(raw: unknown): SavedDeck | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<SavedDeck>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.characterId !== "string" ||
    !Array.isArray(candidate.mainDeck)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    characterId: candidate.characterId,
    mainDeck: candidate.mainDeck.filter((cardId): cardId is string => typeof cardId === "string"),
    createdAt: typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now(),
    updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : Date.now()
  };
}

function loadSavedDecks(): SavedDeck[] {
  if (!canUseLocalStorage()) return [];
  const raw = window.localStorage.getItem(DECK_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<SavedDeckCollection>;
    if (parsed.version !== 1 || !Array.isArray(parsed.decks)) return [];
    return parsed.decks.map(normalizeSavedDeck).filter((deck): deck is SavedDeck => Boolean(deck));
  } catch {
    return [];
  }
}

function persistSavedDecks(decks: SavedDeck[]): void {
  if (!canUseLocalStorage()) return;
  const collection: SavedDeckCollection = {
    version: 1,
    decks
  };
  window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(collection));
}

export interface UiState {
  setup: {
    playerCharacterId: string;
    aiCharacterId: string;
    selectedTalentIds: string[];
    selectedDeckId: string;
    deckBuilderOpen: boolean;
    deckFilter: DeckFilter;
    deckSearch: string;
    activeDeckCardId: string | null;
    deckMessage: string;
  };
  mulliganSelection: Set<string>;
  selectedAttackerId: string | null;
  attackFx: AttackFxState | null;
  cardFx: CardFxState | null;
  cardFxQueue: CardFxState[];
  aiTimer: number | null;
}

export interface GameStore {
  game: ShinDoroGame;
  uiState: UiState;
  getState(): GameState;
  getCharacter(characterId: string): CharacterDefinition;
  getSelectedCharacter(): CharacterDefinition;
  getTalent(talentId: string): TalentDefinition | undefined;
  getTalentCost(talent: TalentDefinition): number | null;
  getTalentCount(talentId: string): number;
  getSpentTalentPoints(): number;
  getRemainingTalentPoints(): number;
  canAddTalent(talent: TalentDefinition): boolean;
  getSavedDecks(characterId?: string): SavedDeck[];
  getSelectedSavedDeck(): SavedDeck | null;
  getActiveMainDeck(): string[];
  getActiveDeckName(): string;
  getActiveDeckValidation(): DeckValidationResult;
  getConstructibleCards(): CardDefinition[];
  getDeckBuilderCards(): CardDefinition[];
  getDeckCardCounts(): Array<{ card: CardDefinition; count: number }>;
  getActiveDeckCard(): CardDefinition | null;
  resetUiSelections(): void;
  buildTargetSet(): Set<string>;
  scheduleAiTurn(onChange: () => void): void;
  dispose(): void;
  selectPlayerCharacter(characterId: string): void;
  selectAiCharacter(characterId: string): void;
  selectDeck(deckId: string): void;
  toggleDeckBuilder(): void;
  createDeckFromDefault(): void;
  duplicateActiveDeck(): void;
  deleteSelectedDeck(): void;
  renameSelectedDeck(name: string): void;
  addCardToDeck(cardId: string): void;
  removeCardFromDeck(cardId: string): void;
  inspectDeckCard(cardId: string): void;
  setDeckFilter(filter: DeckFilter): void;
  setDeckSearch(query: string): void;
  saveDecks(): void;
  addTalent(talentId: string): void;
  removeTalent(talentId: string): void;
  startGame(): boolean;
  toggleMulliganCard(runtimeId: string): void;
  confirmMulligan(): void;
  restart(): void;
  resolvePendingChoice(payload: PendingChoicePayload): void;
  cancelAttacker(): void;
  toggleAttacker(minionId: string): void;
  playCard(runtimeId: string): boolean;
  attackMinion(minionId: string, onChange?: () => void): boolean;
  attackHero(heroId: string, onChange?: () => void): boolean;
  endTurn(): boolean;
}

export function createGameStore({ game = new ShinDoroGame() }: { game?: ShinDoroGame } = {}): GameStore {
  let savedDecks = loadSavedDecks();
  const uiState: UiState = {
    setup: {
      playerCharacterId: "character_a",
      aiCharacterId: "character_b",
      selectedTalentIds: [],
      selectedDeckId: DEFAULT_DECK_ID,
      deckBuilderOpen: false,
      deckFilter: "all",
      deckSearch: "",
      activeDeckCardId: null,
      deckMessage: ""
    },
    mulliganSelection: new Set<string>(),
    selectedAttackerId: null,
    attackFx: null,
    cardFx: null,
    cardFxQueue: [],
    aiTimer: null
  };
  let attackResolveTimer: number | null = null;
  let attackFxTimer: number | null = null;
  let cardFxTimer: number | null = null;
  let fxSerial = 0;
  let onChangeListener: (() => void) | null = null;

  function notifyChange(): void {
    onChangeListener?.();
  }

  function getCharacter(characterId: string): CharacterDefinition {
    return CHARACTERS.find((character) => character.id === characterId) ?? CHARACTERS[0];
  }

  function getSelectedCharacter(): CharacterDefinition {
    return getCharacter(uiState.setup.playerCharacterId);
  }

  function getTalent(talentId: string): TalentDefinition | undefined {
    return TALENTS.find((item) => item.id === talentId);
  }

  function getTalentCostForPlayer(talent: TalentDefinition): number | null {
    return getTalentCost(talent, PLAYER_TALENT_SEAT);
  }

  function getTalentCount(talentId: string): number {
    return uiState.setup.selectedTalentIds.filter((id) => id === talentId).length;
  }

  function getSpentTalentPoints(): number {
    return uiState.setup.selectedTalentIds.reduce((sum, talentId) => {
      const talent = getTalent(talentId);
      return sum + (talent ? getTalentCostForPlayer(talent) ?? 0 : 0);
    }, 0);
  }

  function getRemainingTalentPoints(): number {
    return getSelectedCharacter().talentPoints - getSpentTalentPoints();
  }

  function canAddTalent(talent: TalentDefinition): boolean {
    const cost = getTalentCostForPlayer(talent);
    return (
      cost !== null &&
      isTalentAvailableForSeat(talent, PLAYER_TALENT_SEAT) &&
      getRemainingTalentPoints() >= cost &&
      getTalentCount(talent.id) < talent.repeatLimit
    );
  }

  function getSavedDecks(characterId = uiState.setup.playerCharacterId): SavedDeck[] {
    return savedDecks
      .filter((deck) => deck.characterId === characterId)
      .sort((left, right) => right.updatedAt - left.updatedAt);
  }

  function getSelectedSavedDeck(): SavedDeck | null {
    if (uiState.setup.selectedDeckId === DEFAULT_DECK_ID) return null;
    const selected = savedDecks.find((deck) => deck.id === uiState.setup.selectedDeckId) ?? null;
    if (selected?.characterId !== uiState.setup.playerCharacterId) return null;
    return selected;
  }

  function getDefaultMainDeck(characterId = uiState.setup.playerCharacterId): string[] {
    return STARTING_DECKS[characterId]?.mainDeck ?? STARTING_DECKS.character_a.mainDeck;
  }

  function getActiveMainDeck(): string[] {
    return getSelectedSavedDeck()?.mainDeck ?? getDefaultMainDeck();
  }

  function getActiveDeckName(): string {
    return getSelectedSavedDeck()?.name ?? "默认预组";
  }

  function getActiveDeckValidation(): DeckValidationResult {
    return validateMainDeck(getActiveMainDeck());
  }

  function getActiveDeckCard(): CardDefinition | null {
    const cardId = uiState.setup.activeDeckCardId ?? getDeckBuilderCards()[0]?.id;
    if (!cardId) return null;
    return CARD_LIBRARY.find((card) => card.id === cardId) ?? null;
  }

  function getDeckBuilderCards(): CardDefinition[] {
    const query = uiState.setup.deckSearch.trim().toLowerCase();
    return getConstructibleCards().filter((card) => {
      const filter = uiState.setup.deckFilter;
      const textMatches =
        !query ||
        card.id.toLowerCase().includes(query) ||
        card.name.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query);

      if (!textMatches) return false;
      if (filter === "all") return true;
      if (filter === "minion" || filter === "spell" || filter === "trap" || filter === "persistent") {
        return card.type === filter;
      }
      if (filter === "cost_7_plus") return card.cost >= 7;
      if (filter.startsWith("cost_")) return card.cost === Number(filter.replace("cost_", ""));
      if (filter === "guard") return card.tags?.includes("guard") ?? false;
      if (filter === "rush") return card.tags?.includes("rush") ?? false;
      if (filter === "battlecry") return card.effects.some((effect) => effect.trigger === "onPlay");
      if (filter === "deathrattle") return card.effects.some((effect) => effect.trigger === "onDeath");
      return true;
    });
  }

  function getDeckCardCounts(): Array<{ card: CardDefinition; count: number }> {
    const counts = new Map<string, number>();
    for (const cardId of getActiveMainDeck()) {
      counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([cardId, count]) => {
        const card = CARD_LIBRARY.find((item) => item.id === cardId);
        return card ? { card, count } : null;
      })
      .filter((item): item is { card: CardDefinition; count: number } => Boolean(item))
      .sort((left, right) => {
        if (left.card.cost !== right.card.cost) return left.card.cost - right.card.cost;
        return left.card.name.localeCompare(right.card.name, "zh-Hans");
      });
  }

  function commitDecks(message: string): void {
    savedDecks = [...savedDecks];
    persistSavedDecks(savedDecks);
    uiState.setup.deckMessage = message;
  }

  function createDeckFromDefaultWithName(name: string): SavedDeck {
    const now = Date.now();
    const deck: SavedDeck = {
      id: createDeckId(),
      name,
      characterId: uiState.setup.playerCharacterId,
      mainDeck: [...getDefaultMainDeck()],
      createdAt: now,
      updatedAt: now
    };
    savedDecks.push(deck);
    uiState.setup.selectedDeckId = deck.id;
    return deck;
  }

  function ensureEditableDeck(): SavedDeck {
    const selected = getSelectedSavedDeck();
    if (selected) return selected;
    return createDeckFromDefaultWithName(`${getSelectedCharacter().name} 自定义卡组`);
  }

  function touchDeck(deck: SavedDeck): void {
    deck.updatedAt = Date.now();
  }

  function resetUiSelections(): void {
    clearAttackFx();
    uiState.mulliganSelection = new Set<string>();
    uiState.selectedAttackerId = null;
  }

  function buildTargetSet(): Set<string> {
    if (!uiState.selectedAttackerId) return new Set<string>();
    return new Set(game.getAttackTargets(uiState.selectedAttackerId).map((target) => target.id));
  }

  function clearAiTimer(): void {
    if (uiState.aiTimer !== null) {
      window.clearTimeout(uiState.aiTimer);
      uiState.aiTimer = null;
    }
  }

  function clearAttackTimers(): void {
    if (attackResolveTimer !== null) {
      window.clearTimeout(attackResolveTimer);
      attackResolveTimer = null;
    }
    if (attackFxTimer !== null) {
      window.clearTimeout(attackFxTimer);
      attackFxTimer = null;
    }
  }

  function clearAttackFx(): void {
    clearAttackTimers();
    uiState.attackFx = null;
  }

  function clearCardFxTimer(): void {
    if (cardFxTimer !== null) {
      window.clearTimeout(cardFxTimer);
      cardFxTimer = null;
    }
  }

  function clearCardFx(): void {
    clearCardFxTimer();
    uiState.cardFx = null;
    uiState.cardFxQueue = [];
  }

  function buildVisualSnapshot(state: GameState = game.getState()): VisualSnapshot {
    const buildPlayerSnapshot = (playerId: PlayerId) => {
      const player = state.players[playerId];
      return {
        boardIds: new Set(player.board.map((minion) => minion.instanceId)),
        persistentIds: new Set(player.persistents.map((card) => card.instanceId)),
        trapIds: new Set(player.traps.map((card) => card.instanceId)),
        graveyardIds: new Set(player.graveyard.map((entry) => entry.runtimeId))
      };
    };

    return {
      players: {
        P1: buildPlayerSnapshot("P1"),
        P2: buildPlayerSnapshot("P2")
      }
    };
  }

  function createCardFx(kind: CardFxState["kind"], ownerId: PlayerId, cardName: string, targetId: string | null = null): CardFxState {
    fxSerial += 1;
    return {
      id: `card_fx_${fxSerial}`,
      kind,
      ownerId,
      cardName,
      targetId
    };
  }

  function collectCardFx(before: VisualSnapshot, state: GameState = game.getState()): CardFxState[] {
    const events: CardFxState[] = [];

    (["P1", "P2"] as const).forEach((playerId) => {
      const player = state.players[playerId];
      const previous = before.players[playerId];

      for (const entry of player.graveyard) {
        if (previous.graveyardIds.has(entry.runtimeId)) continue;
        try {
          const definition = getCardDefinition(entry.id);
          if (definition.type === "spell") {
            events.push(createCardFx("spellCast", playerId, entry.name));
          } else if (definition.type === "trap") {
            events.push(createCardFx("trapTrigger", playerId, entry.name));
          }
        } catch {
        }
      }

      for (const minion of player.board) {
        if (!previous.boardIds.has(minion.instanceId)) {
          events.push(createCardFx("summonMinion", playerId, minion.name, minion.instanceId));
        }
      }

      for (const card of player.persistents) {
        if (!previous.persistentIds.has(card.instanceId)) {
          events.push(createCardFx("placePersistent", playerId, card.name, card.instanceId));
        }
      }

      for (const card of player.traps) {
        if (!previous.trapIds.has(card.instanceId)) {
          events.push(createCardFx("placeTrap", playerId, card.name, card.instanceId));
        }
      }
    });

    return events;
  }

  function activateNextCardFx(): void {
    clearCardFxTimer();
    const next = uiState.cardFxQueue.shift() ?? null;
    uiState.cardFx = next;
    notifyChange();

    if (!next) return;

    cardFxTimer = window.setTimeout(() => {
      cardFxTimer = null;
      uiState.cardFx = null;
      notifyChange();
      if (uiState.cardFxQueue.length) {
        activateNextCardFx();
      }
    }, CARD_FX_DURATION_MS);
  }

  function enqueueCardFx(events: CardFxState[]): void {
    if (!events.length) return;
    uiState.cardFxQueue.push(...events);
    if (!uiState.cardFx) {
      activateNextCardFx();
    }
  }

  function runWithCardFx<T>(execute: () => T, shouldCollect: (result: T) => boolean = (result) => Boolean(result)): T {
    const before = buildVisualSnapshot();
    const result = execute();
    if (shouldCollect(result)) {
      enqueueCardFx(collectCardFx(before));
    }
    return result;
  }

  function beginAttackFx(
    targetId: string,
    targetType: AttackFxState["targetType"],
    executeAttack: (attackerId: string) => boolean,
    onChange?: () => void
  ): boolean {
    const attackerId = uiState.selectedAttackerId;
    if (!attackerId || uiState.attackFx) return false;
    if (!buildTargetSet().has(targetId)) return false;

    clearAttackTimers();
    uiState.attackFx = { attackerId, targetId, targetType };

    attackResolveTimer = window.setTimeout(() => {
      attackResolveTimer = null;
      const didAttack = executeAttack(attackerId);
      if (didAttack) {
        uiState.selectedAttackerId = null;
      }
      onChange?.();

      attackFxTimer = window.setTimeout(() => {
        attackFxTimer = null;
        uiState.attackFx = null;
        onChange?.();
      }, ATTACK_FX_TAIL_MS);
    }, ATTACK_RESOLVE_DELAY_MS);

    return true;
  }

  return {
    game,
    uiState,
    getState: () => game.getState(),
    getCharacter,
    getSelectedCharacter,
    getTalent,
    getTalentCost: getTalentCostForPlayer,
    getTalentCount,
    getSpentTalentPoints,
    getRemainingTalentPoints,
    canAddTalent,
    getSavedDecks,
    getSelectedSavedDeck,
    getActiveMainDeck,
    getActiveDeckName,
    getActiveDeckValidation,
    getConstructibleCards,
    getDeckBuilderCards,
    getDeckCardCounts,
    getActiveDeckCard,
    resetUiSelections,
    buildTargetSet,
    scheduleAiTurn(onChange: () => void): void {
      onChangeListener = onChange;
      clearAiTimer();
      const state = game.getState();
      if (state.currentPlayer === "P2" && (state.phase === "mainTurn" || state.phase === "combat") && !state.winner) {
        const pendingFxCount = (uiState.cardFx ? 1 : 0) + uiState.cardFxQueue.length;
        const delay = pendingFxCount > 0 ? pendingFxCount * CARD_FX_DURATION_MS + 140 : AI_ACTION_DELAY_MS;
        uiState.aiTimer = window.setTimeout(() => {
          clearAttackFx();
          runWithCardFx(() => game.runAiStep());
          uiState.selectedAttackerId = null;
          onChange();
        }, delay);
      }
    },
    dispose(): void {
      clearAiTimer();
      clearAttackFx();
      clearCardFx();
    },
    selectPlayerCharacter(characterId: string): void {
      uiState.setup.playerCharacterId = characterId;
      uiState.setup.selectedTalentIds = [];
      uiState.setup.selectedDeckId = DEFAULT_DECK_ID;
      uiState.setup.activeDeckCardId = null;
      uiState.setup.deckMessage = "已切换角色，卡组选择已回到默认预组。";
    },
    selectAiCharacter(characterId: string): void {
      uiState.setup.aiCharacterId = characterId;
    },
    selectDeck(deckId: string): void {
      if (deckId === DEFAULT_DECK_ID || savedDecks.some((deck) => deck.id === deckId && deck.characterId === uiState.setup.playerCharacterId)) {
        uiState.setup.selectedDeckId = deckId;
        uiState.setup.activeDeckCardId = null;
        uiState.setup.deckMessage = deckId === DEFAULT_DECK_ID ? "已选择默认预组。" : "已选择自定义卡组。";
      }
    },
    toggleDeckBuilder(): void {
      uiState.setup.deckBuilderOpen = !uiState.setup.deckBuilderOpen;
      uiState.setup.deckMessage = uiState.setup.deckBuilderOpen ? "已打开卡组构筑器。" : "已收起卡组构筑器。";
    },
    createDeckFromDefault(): void {
      createDeckFromDefaultWithName(`${getSelectedCharacter().name} 新卡组`);
      uiState.setup.deckBuilderOpen = true;
      commitDecks("已从默认预组创建新卡组。");
    },
    duplicateActiveDeck(): void {
      const now = Date.now();
      const sourceName = getActiveDeckName();
      const deck: SavedDeck = {
        id: createDeckId(),
        name: `${sourceName} 副本`,
        characterId: uiState.setup.playerCharacterId,
        mainDeck: [...getActiveMainDeck()],
        createdAt: now,
        updatedAt: now
      };
      savedDecks.push(deck);
      uiState.setup.selectedDeckId = deck.id;
      commitDecks("已复制当前卡组。");
    },
    deleteSelectedDeck(): void {
      const selected = getSelectedSavedDeck();
      if (!selected) {
        uiState.setup.deckMessage = "默认预组不能删除。";
        return;
      }
      savedDecks = savedDecks.filter((deck) => deck.id !== selected.id);
      uiState.setup.selectedDeckId = DEFAULT_DECK_ID;
      uiState.setup.activeDeckCardId = null;
      commitDecks("已删除自定义卡组，并切回默认预组。");
    },
    renameSelectedDeck(name: string): void {
      const selected = getSelectedSavedDeck();
      const nextName = name.trim();
      if (!selected || !nextName) {
        uiState.setup.deckMessage = selected ? "卡组名称不能为空。" : "默认预组不能重命名。";
        return;
      }
      selected.name = nextName.slice(0, 32);
      touchDeck(selected);
      commitDecks("已重命名卡组。");
    },
    addCardToDeck(cardId: string): void {
      const card = CARD_LIBRARY.find((item) => item.id === cardId);
      if (!card || !isConstructibleCard(card)) {
        uiState.setup.deckMessage = "这张卡不能加入主卡组。";
        return;
      }
      const deck = ensureEditableDeck();
      deck.mainDeck.push(card.id);
      touchDeck(deck);
      uiState.setup.activeDeckCardId = card.id;
      commitDecks(`已加入 ${card.name}。`);
    },
    removeCardFromDeck(cardId: string): void {
      const deck = getSelectedSavedDeck();
      if (!deck) {
        uiState.setup.deckMessage = "默认预组不能直接编辑，请先创建或复制自定义卡组。";
        return;
      }
      const index = deck.mainDeck.lastIndexOf(cardId);
      if (index < 0) {
        uiState.setup.deckMessage = "当前卡组中没有这张卡。";
        return;
      }
      const card = CARD_LIBRARY.find((item) => item.id === cardId);
      deck.mainDeck.splice(index, 1);
      touchDeck(deck);
      uiState.setup.activeDeckCardId = cardId;
      commitDecks(`已移除 ${card?.name ?? cardId}。`);
    },
    inspectDeckCard(cardId: string): void {
      uiState.setup.activeDeckCardId = cardId;
    },
    setDeckFilter(filter: DeckFilter): void {
      uiState.setup.deckFilter = filter;
      uiState.setup.activeDeckCardId = null;
    },
    setDeckSearch(query: string): void {
      uiState.setup.deckSearch = query;
      uiState.setup.activeDeckCardId = null;
      uiState.setup.deckMessage = query ? `搜索：${query}` : "已清空搜索。";
    },
    saveDecks(): void {
      persistSavedDecks(savedDecks);
      uiState.setup.deckMessage = "卡组已保存到本机。";
    },
    addTalent(talentId: string): void {
      const talent = getTalent(talentId);
      if (talent && canAddTalent(talent)) {
        uiState.setup.selectedTalentIds.push(talent.id);
      }
    },
    removeTalent(talentId: string): void {
      const index = uiState.setup.selectedTalentIds.lastIndexOf(talentId);
      if (index >= 0) {
        uiState.setup.selectedTalentIds.splice(index, 1);
      }
    },
    startGame(): boolean {
      const deckValidation = getActiveDeckValidation();
      if (!deckValidation.valid) {
        uiState.setup.deckMessage = `卡组不合法：${deckValidation.errors[0] ?? "请检查卡组。"}`;
        return false;
      }
      game.setupMatch({
        playerCharacterId: uiState.setup.playerCharacterId,
        aiCharacterId: uiState.setup.aiCharacterId,
        playerTalentIds: uiState.setup.selectedTalentIds,
        playerMainDeck: [...getActiveMainDeck()],
        playerDeckName: getActiveDeckName()
      });
      resetUiSelections();
      clearCardFx();
      return true;
    },
    toggleMulliganCard(runtimeId: string): void {
      if (game.getState().screen !== "mulligan") return;
      if (uiState.mulliganSelection.has(runtimeId)) {
        uiState.mulliganSelection.delete(runtimeId);
      } else {
        uiState.mulliganSelection.add(runtimeId);
      }
    },
    confirmMulligan(): void {
      const player = game.getState().players.P1;
      const indices = player.hand
        .map((card, index) => ({ runtimeId: card.runtimeId, index }))
        .filter((item) => uiState.mulliganSelection.has(item.runtimeId))
        .map((item) => item.index);
      uiState.mulliganSelection.clear();
      game.completePlayerMulligan(indices);
    },
    restart(): void {
      clearAiTimer();
      clearAttackFx();
      clearCardFx();
      game.reset();
      resetUiSelections();
      uiState.setup.selectedTalentIds = [];
    },
    resolvePendingChoice(payload: PendingChoicePayload): void {
      game.handlePendingChoice(payload);
    },
    cancelAttacker(): void {
      clearAttackFx();
      uiState.selectedAttackerId = null;
    },
    toggleAttacker(minionId: string): void {
      if (uiState.attackFx) return;
      if (uiState.selectedAttackerId === minionId) {
        uiState.selectedAttackerId = null;
        return;
      }
      if (!game.getAttackTargets(minionId).length) return;
      uiState.selectedAttackerId = minionId;
    },
    playCard(runtimeId: string): boolean {
      clearAttackFx();
      const didPlay = runWithCardFx(() => game.playCard(runtimeId));
      if (didPlay) {
        uiState.selectedAttackerId = null;
      }
      return didPlay;
    },
    attackMinion(minionId: string, onChange?: () => void): boolean {
      return beginAttackFx(minionId, "minion", (attackerId) => game.attack(attackerId, minionId, "minion"), onChange);
    },
    attackHero(heroId: string, onChange?: () => void): boolean {
      return beginAttackFx(heroId, "hero", (attackerId) => game.attack(attackerId, heroId, "hero"), onChange);
    },
    endTurn(): boolean {
      clearAttackFx();
      uiState.selectedAttackerId = null;
      return game.endTurn();
    }
  };
}
