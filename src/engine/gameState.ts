import { CHARACTER_LOOKUP } from "../data/characters.js";
import { getCardDefinition } from "../data/cards.js";
import { STARTING_DECKS } from "../data/decks.js";
import { TALENT_LOOKUP } from "../data/talents.js";
import type {
  CardDefinition,
  CharacterDefinition,
  Effect,
  EffectAction,
  EffectContext,
  GameAiAdapter,
  GameState,
  LogEntry,
  PendingChoicePayload,
  PlayerId,
  PlayerState,
  RuntimeCard,
  SetupMatchConfig,
  SlotAdjustOptions
} from "../types.js";
import { createEmptyPlayerState, createRuntimeCard, shuffle } from "./rules.js";
import { chooseAiMulliganIndices, chooseAiTalentIds } from "./ai.js";
import {
  attack,
  attackWith,
  checkForDeaths,
  checkGameOver,
  drawCards,
  getAttackTargets,
  getAIAttackTargets,
  getPlayableCards,
  getReadyAttackers,
  playCard,
  playCardAtIndex,
  resolveAction,
  resolveEffects,
  resolveOnTurnStart,
  summonMinion,
  triggerTraps
} from "./effects.js";
import {
  beginTurn,
  buildTurnStartQueue,
  completePlayerMulligan,
  endTurn,
  finishStartTurn,
  handlePendingChoice,
  performMulligan,
  processTurnStartQueue,
  runAiStep,
  runAiTurn
} from "./phases.js";
import { adjustSlot, applyAdvantageSlots, resolveCharacterSlot, resolveOptionalGodDraw, resolveUltimateGodDraw } from "./slotResolver.js";

const PLAYER_ID: PlayerId = "P1";
const AI_ID: PlayerId = "P2";

function createLogEntry(turn: number, message: string, tone: LogEntry["tone"] = "neutral"): LogEntry {
  return {
    id: `${turn}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    turn,
    tone,
    message
  };
}

function createEmptyState(): GameState {
  return {
    screen: "setup",
    phase: "setup",
    turn: 1,
    currentPlayer: PLAYER_ID,
    players: {
      [PLAYER_ID]: createEmptyPlayerState(PLAYER_ID, "character_a"),
      [AI_ID]: createEmptyPlayerState(AI_ID, "character_b")
    } as Record<PlayerId, PlayerState>,
    actionLog: [],
    effectStack: [],
    pendingChoice: null,
    turnStartQueue: [],
    selectedAttackerId: null,
    lastAdvantage: null,
    winner: null,
    config: null
  };
}

export class ShinDoroGame implements GameAiAdapter {
  rng: () => number;
  state: GameState;

  constructor({ rng = Math.random }: { rng?: () => number } = {}) {
    this.rng = rng;
    this.state = createEmptyState();
  }

  createEmptyState(): GameState {
    return createEmptyState();
  }

  getState(): GameState {
    return this.state;
  }

  reset(): GameState {
    this.state = createEmptyState();
    return this.state;
  }

  setupMatch({ playerCharacterId, aiCharacterId, playerTalentIds }: SetupMatchConfig): GameState {
    this.state = createEmptyState();
    this.state.screen = "mulligan";
    this.state.phase = "mulligan";
    this.state.config = {
      playerCharacterId,
      aiCharacterId,
      playerTalentIds: [...playerTalentIds]
    };

    this.state.players[PLAYER_ID] = this.buildPlayer(PLAYER_ID, playerCharacterId, playerTalentIds);
    this.state.players[AI_ID] = this.buildPlayer(AI_ID, aiCharacterId, chooseAiTalentIds(aiCharacterId, "second"));

    this.applyGameStartEffects(this.state.players[PLAYER_ID]);
    this.applyGameStartEffects(this.state.players[AI_ID]);

    this.drawOpeningHand(this.state.players[PLAYER_ID], 3);
    this.drawOpeningHand(this.state.players[AI_ID], 4);
    this.addCoinToSecondPlayer();
    this.performMulligan(AI_ID, this.getRecommendedMulliganIndices(AI_ID));

    this.log("对局已创建。选择你要替换的起手牌，然后开始战斗。");
    return this.state;
  }

  buildPlayer(playerId: PlayerId, characterId: string, selectedTalentIds: string[]): PlayerState {
    const character = this.getCharacter(characterId);
    const deckConfig = STARTING_DECKS[characterId];
    if (!deckConfig) {
      throw new Error(`Missing deck config for ${characterId}`);
    }
    const player = createEmptyPlayerState(playerId, characterId);
    player.maxHp = character.baseHp;
    player.hp = character.baseHp;
    player.selectedTalents = [...selectedTalentIds];
    player.deck = shuffle(
      deckConfig.mainDeck.map((cardId) => createRuntimeCard(getCardDefinition(cardId))),
      this.rng
    );
    player.reserveDeck = deckConfig.sideboard.map((cardId) => createRuntimeCard(getCardDefinition(cardId)));
    return player;
  }

  applyGameStartEffects(player: PlayerState): void {
    for (const talentId of player.selectedTalents) {
      const talent = TALENT_LOOKUP[talentId];
      if (!talent) continue;
      const effect = talent.effect;
      switch (effect.type) {
        case "addMaxHp":
          player.maxHp += effect.amount;
          player.hp += effect.amount;
          break;
        case "addHandLimit":
          player.handLimit += effect.amount;
          break;
        case "modifySlotGain":
          player.temporaryFlags.slotGainModifier[effect.slot] += effect.amount;
          break;
        case "bonusDraw":
          player.temporaryFlags.openingBonusDraw += effect.amount;
          break;
        case "bonusMana":
          player.temporaryFlags.openingBonusMana += effect.amount;
          break;
        case "setManaCap":
          player.temporaryFlags.maxManaCap = Math.max(player.temporaryFlags.maxManaCap, effect.amount);
          break;
        case "setTopDeckByRule":
          this.moveDeckCardToTopByRule(player, effect.rule);
          break;
        case "giveRushToLowCostMinions":
          player.temporaryFlags.lowCostRushMaxCost = Math.max(
            player.temporaryFlags.lowCostRushMaxCost ?? 0,
            effect.maxCost
          );
          break;
        case "reduceHighCostMinionCost":
          player.temporaryFlags.highCostMinionDiscount = { threshold: effect.threshold, amount: effect.amount };
          this.applyDeckWideDiscount(player, effect.threshold, effect.amount);
          break;
        case "grantLoneMinionGuard":
          player.temporaryFlags.loneMinionGuard = true;
          break;
        case "increaseSpellDamage":
          player.temporaryFlags.spellDamageBonus += effect.amount;
          break;
        case "healOnLowHpTurnStart":
          player.temporaryFlags.lowHpTurnStartHeal = { threshold: effect.threshold, amount: effect.amount };
          break;
        case "retainSlotAfterBurst":
          player.temporaryFlags.preserveBurstSlotAmount = Math.max(
            player.temporaryFlags.preserveBurstSlotAmount,
            effect.amount
          );
          break;
        case "openingSlotBonus":
          player.temporaryFlags.openingSlotBonus[effect.slot] += effect.amount;
          if (effect.slot === "jump") {
            player.jumpSlot += effect.amount;
          } else {
            player.godDrawSlot += effect.amount;
          }
          break;
        case "overflowOpponentDiscard":
          player.temporaryFlags.overflowOpponentDiscardCount += effect.count;
          break;
        case "overflowOpponentMill":
          player.temporaryFlags.overflowOpponentMillCount += effect.count;
          break;
        case "increaseHealingReceived":
          player.temporaryFlags.healingReceivedBonus += effect.amount;
          break;
        default:
          break;
      }
    }
  }

  moveDeckCardToTopByRule(player: PlayerState, rule: "lowestCostSpell" | "lowestCostCard"): void {
    const candidates = player.deck
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => (rule === "lowestCostSpell" ? card.type === "spell" : true))
      .sort((left, right) => left.card.currentCost - right.card.currentCost);

    if (!candidates.length) return;
    const [{ index }] = candidates;
    const [picked] = player.deck.splice(index, 1);
    if (picked) {
      player.deck.unshift(picked);
    }
  }

  applyDeckWideDiscount(player: PlayerState, threshold: number, amount: number): void {
    const adjustCard = (card: RuntimeCard) => {
      if (card.type !== "minion" || card.baseCost <= threshold) return card;
      return { ...card, currentCost: Math.max(0, card.currentCost - amount) };
    };

    player.deck = player.deck.map(adjustCard);
    player.reserveDeck = player.reserveDeck.map(adjustCard);
  }

  drawOpeningHand(player: PlayerState, count: number): void {
    const total = count + player.temporaryFlags.openingBonusDraw;
    this.drawCards(player.id, total, "起手抽牌");
  }

  addCoinToSecondPlayer(): void {
    this.state.players[AI_ID].hand.push(createRuntimeCard(getCardDefinition("coin")));
  }

  getRecommendedMulliganIndices(playerId: PlayerId): number[] {
    return chooseAiMulliganIndices(this.state, playerId);
  }

  completePlayerMulligan(indices: number[]) {
    return completePlayerMulligan(this, indices);
  }

  performMulligan(playerId: PlayerId, indices: number[]): void {
    performMulligan(this, playerId, indices);
  }

  beginTurn(): void {
    beginTurn(this);
  }

  buildTurnStartQueue(playerId: PlayerId): void {
    buildTurnStartQueue(this, playerId);
  }

  processTurnStartQueue(): void {
    processTurnStartQueue(this);
  }

  finishStartTurn(): void {
    finishStartTurn(this);
  }

  handlePendingChoice(payload: PendingChoicePayload): void {
    handlePendingChoice(this, payload);
  }

  resolveUltimateGodDraw(playerId: PlayerId, cardId: string): void {
    resolveUltimateGodDraw(this, playerId, cardId);
  }

  resolveOptionalGodDraw(playerId: PlayerId, cardId: string): void {
    resolveOptionalGodDraw(this, playerId, cardId);
  }

  resolveCharacterSlot(playerId: PlayerId, tier: "jump10" | "jump13"): void {
    resolveCharacterSlot(this, playerId, tier);
  }

  resolveOnTurnStart(playerId: PlayerId): void {
    resolveOnTurnStart(this, playerId);
  }

  drawCards(playerId: PlayerId, count: number, reason = "抽牌"): void {
    drawCards(this, playerId, count, reason);
  }

  playCard(runtimeId: string): boolean {
    return playCard(this, runtimeId);
  }

  playCardAtIndex(playerId: PlayerId, index: number): boolean {
    return playCardAtIndex(this, playerId, index);
  }

  summonMinion(
    playerId: PlayerId,
    card: CardDefinition | RuntimeCard,
    options: { triggerOnPlay?: boolean; canTriggerTrap?: boolean } = {}
  ) {
    return summonMinion(this, playerId, card, options);
  }

  resolveEffects(playerId: PlayerId, effects: Effect[], context: EffectContext): void {
    resolveEffects(this, playerId, effects, context);
  }

  triggerTraps(ownerId: PlayerId, conditionType: "enemyCastsSpell" | "enemySummonsMinion", context: EffectContext): void {
    triggerTraps(this, ownerId, conditionType, context);
  }

  resolveAction(playerId: PlayerId, action: EffectAction, context: EffectContext = {}): void {
    resolveAction(this, playerId, action, context);
  }

  adjustSlot(
    playerId: PlayerId,
    slot: "jump" | "godDraw",
    amount: number,
    reason = "效果",
    options: SlotAdjustOptions = {}
  ): number {
    return adjustSlot(this, playerId, slot, amount, reason, options);
  }

  attack(attackerId: string, targetId: string, targetType: "hero" | "minion"): boolean {
    return attack(this, attackerId, targetId, targetType);
  }

  attackWith(playerId: PlayerId, attackerId: string, targetId: string, targetType: "hero" | "minion"): boolean {
    return attackWith(this, playerId, attackerId, targetId, targetType);
  }

  getAttackTargets(attackerId: string, playerId: PlayerId = PLAYER_ID) {
    return getAttackTargets(this, attackerId, playerId);
  }

  getPlayableCards(playerId: PlayerId): RuntimeCard[] {
    return getPlayableCards(this, playerId);
  }

  getReadyAttackers(playerId: PlayerId) {
    return getReadyAttackers(this, playerId);
  }

  getAIAttackTargets(attackerId: string, playerId: PlayerId) {
    return getAIAttackTargets(this, attackerId, playerId);
  }

  endTurn(): boolean {
    return endTurn(this);
  }

  applyAdvantageSlots(value: number, gain: number): void {
    applyAdvantageSlots(this, value, gain);
  }

  checkForDeaths(): void {
    checkForDeaths(this);
  }

  checkGameOver(): boolean {
    return checkGameOver(this);
  }

  runAiTurn(): boolean {
    return runAiTurn(this);
  }

  runAiStep(): boolean {
    return runAiStep(this);
  }

  log(message: string, tone: LogEntry["tone"] = "neutral"): void {
    this.state.actionLog.unshift(createLogEntry(this.state.turn, message, tone));
    this.state.actionLog = this.state.actionLog.slice(0, 40);
  }

  getCurrentPlayer(): PlayerState {
    return this.getPlayer(this.state.currentPlayer);
  }

  getPlayer(playerId: PlayerId): PlayerState {
    return this.state.players[playerId];
  }

  getOpponent(playerId: PlayerId): PlayerState {
    return this.state.players[this.getOpponentId(playerId)];
  }

  getOpponentId(playerId: PlayerId): PlayerId {
    return playerId === PLAYER_ID ? AI_ID : PLAYER_ID;
  }

  getCharacter(characterId: string): CharacterDefinition {
    const character = CHARACTER_LOOKUP[characterId];
    if (!character) {
      throw new Error(`Unknown character id: ${characterId}`);
    }
    return character;
  }
}
