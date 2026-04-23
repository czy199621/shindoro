import { getCardDefinition } from "../data/cards.js";
import { CHARACTERS } from "../data/characters.js";
import { TALENTS, getTalentCost, isTalentAvailableForSeat } from "../data/talents.js";
import { ShinDoroGame } from "../engine/gameState.js";
import type { CharacterDefinition, GameState, PendingChoicePayload, PlayerId, TalentDefinition } from "../types.js";

const PLAYER_TALENT_SEAT = "first" as const;
const AI_ACTION_DELAY_MS = 520;
const ATTACK_RESOLVE_DELAY_MS = 140;
const ATTACK_FX_TAIL_MS = 220;
const CARD_FX_DURATION_MS = 620;

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

export interface UiState {
  setup: {
    playerCharacterId: string;
    aiCharacterId: string;
    selectedTalentIds: string[];
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
  resetUiSelections(): void;
  buildTargetSet(): Set<string>;
  scheduleAiTurn(onChange: () => void): void;
  dispose(): void;
  selectPlayerCharacter(characterId: string): void;
  selectAiCharacter(characterId: string): void;
  addTalent(talentId: string): void;
  removeTalent(talentId: string): void;
  startGame(): void;
  toggleMulliganCard(runtimeId: string): void;
  clearMulliganSelection(): void;
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
  const uiState: UiState = {
    setup: {
      playerCharacterId: "character_a",
      aiCharacterId: "character_b",
      selectedTalentIds: []
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
    },
    selectAiCharacter(characterId: string): void {
      uiState.setup.aiCharacterId = characterId;
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
    startGame(): void {
      game.setupMatch({
        playerCharacterId: uiState.setup.playerCharacterId,
        aiCharacterId: uiState.setup.aiCharacterId,
        playerTalentIds: uiState.setup.selectedTalentIds
      });
      resetUiSelections();
      clearCardFx();
    },
    toggleMulliganCard(runtimeId: string): void {
      if (uiState.mulliganSelection.has(runtimeId)) {
        uiState.mulliganSelection.delete(runtimeId);
      } else {
        uiState.mulliganSelection.add(runtimeId);
      }
    },
    clearMulliganSelection(): void {
      uiState.mulliganSelection.clear();
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
      uiState.selectedAttackerId = uiState.selectedAttackerId === minionId ? null : minionId;
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
