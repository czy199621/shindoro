import { CHARACTER_LOOKUP } from "../data/characters.js";
import { getCardDefinition } from "../data/cards.js";
import { STARTING_DECKS } from "../data/decks.js";
import { TALENT_LOOKUP } from "../data/talents.js";
import { createEmptyPlayerState, createRuntimeCard, shuffle } from "./rules.js";
import { chooseAiMulliganIndices, chooseAiTalentIds } from "./ai.js";
import { attack, attackWith, checkForDeaths, checkGameOver, drawCards, getAttackTargets, getAIAttackTargets, getPlayableCards, getReadyAttackers, playCard, playCardAtIndex, resolveAction, resolveEffects, resolveOnTurnStart, summonMinion, triggerTraps } from "./effects.js";
import { beginTurn, buildTurnStartQueue, completePlayerMulligan, endTurn, finishStartTurn, handlePendingChoice, performMulligan, processTurnStartQueue, runAiStep, runAiTurn } from "./phases.js";
import { adjustSlot, applyAdvantageSlots, resolveCharacterSlot, resolveOptionalGodDraw, resolveUltimateGodDraw } from "./slotResolver.js";
const PLAYER_ID = "P1";
const AI_ID = "P2";
function createLogEntry(turn, message, tone = "neutral") {
    return {
        id: `${turn}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        turn,
        tone,
        message
    };
}
function createEmptyState() {
    return {
        screen: "setup",
        phase: "setup",
        turn: 1,
        currentPlayer: PLAYER_ID,
        players: {
            [PLAYER_ID]: createEmptyPlayerState(PLAYER_ID, "character_a"),
            [AI_ID]: createEmptyPlayerState(AI_ID, "character_b")
        },
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
export class ShinDoroGame {
    rng;
    state;
    constructor({ rng = Math.random } = {}) {
        this.rng = rng;
        this.state = createEmptyState();
    }
    createEmptyState() {
        return createEmptyState();
    }
    getState() {
        return this.state;
    }
    reset() {
        this.state = createEmptyState();
        return this.state;
    }
    setupMatch({ playerCharacterId, aiCharacterId, playerTalentIds }) {
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
    buildPlayer(playerId, characterId, selectedTalentIds) {
        const character = this.getCharacter(characterId);
        const deckConfig = STARTING_DECKS[characterId];
        if (!deckConfig) {
            throw new Error(`Missing deck config for ${characterId}`);
        }
        const player = createEmptyPlayerState(playerId, characterId);
        player.maxHp = character.baseHp;
        player.hp = character.baseHp;
        player.selectedTalents = [...selectedTalentIds];
        player.deck = shuffle(deckConfig.mainDeck.map((cardId) => createRuntimeCard(getCardDefinition(cardId))), this.rng);
        player.reserveDeck = deckConfig.sideboard.map((cardId) => createRuntimeCard(getCardDefinition(cardId)));
        return player;
    }
    applyGameStartEffects(player) {
        for (const talentId of player.selectedTalents) {
            const talent = TALENT_LOOKUP[talentId];
            if (!talent)
                continue;
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
                case "setTopDeckByRule":
                    this.moveDeckCardToTopByRule(player, effect.rule);
                    break;
                case "giveRushToLowCostMinions":
                    player.temporaryFlags.lowCostRushMaxCost = Math.max(player.temporaryFlags.lowCostRushMaxCost ?? 0, effect.maxCost);
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
                    player.temporaryFlags.preserveBurstSlotAmount = Math.max(player.temporaryFlags.preserveBurstSlotAmount, effect.amount);
                    break;
                case "openingSlotBonus":
                    player.temporaryFlags.openingSlotBonus[effect.slot] += effect.amount;
                    if (effect.slot === "jump") {
                        player.jumpSlot += effect.amount;
                    }
                    else {
                        player.godDrawSlot += effect.amount;
                    }
                    break;
                default:
                    break;
            }
        }
    }
    moveDeckCardToTopByRule(player, rule) {
        const candidates = player.deck
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => (rule === "lowestCostSpell" ? card.type === "spell" : true))
            .sort((left, right) => left.card.currentCost - right.card.currentCost);
        if (!candidates.length)
            return;
        const [{ index }] = candidates;
        const [picked] = player.deck.splice(index, 1);
        if (picked) {
            player.deck.unshift(picked);
        }
    }
    applyDeckWideDiscount(player, threshold, amount) {
        const adjustCard = (card) => {
            if (card.type !== "minion" || card.baseCost <= threshold)
                return card;
            return { ...card, currentCost: Math.max(0, card.currentCost - amount) };
        };
        player.deck = player.deck.map(adjustCard);
        player.reserveDeck = player.reserveDeck.map(adjustCard);
    }
    drawOpeningHand(player, count) {
        const total = count + player.temporaryFlags.openingBonusDraw;
        this.drawCards(player.id, total, "起手抽牌");
    }
    addCoinToSecondPlayer() {
        this.state.players[AI_ID].hand.push(createRuntimeCard(getCardDefinition("coin")));
    }
    getRecommendedMulliganIndices(playerId) {
        return chooseAiMulliganIndices(this.state, playerId);
    }
    completePlayerMulligan(indices) {
        return completePlayerMulligan(this, indices);
    }
    performMulligan(playerId, indices) {
        performMulligan(this, playerId, indices);
    }
    beginTurn() {
        beginTurn(this);
    }
    buildTurnStartQueue(playerId) {
        buildTurnStartQueue(this, playerId);
    }
    processTurnStartQueue() {
        processTurnStartQueue(this);
    }
    finishStartTurn() {
        finishStartTurn(this);
    }
    handlePendingChoice(payload) {
        handlePendingChoice(this, payload);
    }
    resolveUltimateGodDraw(playerId, cardId) {
        resolveUltimateGodDraw(this, playerId, cardId);
    }
    resolveOptionalGodDraw(playerId, cardId) {
        resolveOptionalGodDraw(this, playerId, cardId);
    }
    resolveCharacterSlot(playerId, tier) {
        resolveCharacterSlot(this, playerId, tier);
    }
    resolveOnTurnStart(playerId) {
        resolveOnTurnStart(this, playerId);
    }
    drawCards(playerId, count, reason = "抽牌") {
        drawCards(this, playerId, count, reason);
    }
    playCard(runtimeId) {
        return playCard(this, runtimeId);
    }
    playCardAtIndex(playerId, index) {
        return playCardAtIndex(this, playerId, index);
    }
    summonMinion(playerId, card, options = {}) {
        return summonMinion(this, playerId, card, options);
    }
    resolveEffects(playerId, effects, context) {
        resolveEffects(this, playerId, effects, context);
    }
    triggerTraps(ownerId, conditionType, context) {
        triggerTraps(this, ownerId, conditionType, context);
    }
    resolveAction(playerId, action, context = {}) {
        resolveAction(this, playerId, action, context);
    }
    adjustSlot(playerId, slot, amount, reason = "效果", options = {}) {
        return adjustSlot(this, playerId, slot, amount, reason, options);
    }
    attack(attackerId, targetId, targetType) {
        return attack(this, attackerId, targetId, targetType);
    }
    attackWith(playerId, attackerId, targetId, targetType) {
        return attackWith(this, playerId, attackerId, targetId, targetType);
    }
    getAttackTargets(attackerId, playerId = PLAYER_ID) {
        return getAttackTargets(this, attackerId, playerId);
    }
    getPlayableCards(playerId) {
        return getPlayableCards(this, playerId);
    }
    getReadyAttackers(playerId) {
        return getReadyAttackers(this, playerId);
    }
    getAIAttackTargets(attackerId, playerId) {
        return getAIAttackTargets(this, attackerId, playerId);
    }
    endTurn() {
        return endTurn(this);
    }
    applyAdvantageSlots(value, gain) {
        applyAdvantageSlots(this, value, gain);
    }
    checkForDeaths() {
        checkForDeaths(this);
    }
    checkGameOver() {
        return checkGameOver(this);
    }
    runAiTurn() {
        return runAiTurn(this);
    }
    runAiStep() {
        return runAiStep(this);
    }
    log(message, tone = "neutral") {
        this.state.actionLog.unshift(createLogEntry(this.state.turn, message, tone));
        this.state.actionLog = this.state.actionLog.slice(0, 40);
    }
    getCurrentPlayer() {
        return this.getPlayer(this.state.currentPlayer);
    }
    getPlayer(playerId) {
        return this.state.players[playerId];
    }
    getOpponent(playerId) {
        return this.state.players[this.getOpponentId(playerId)];
    }
    getOpponentId(playerId) {
        return playerId === PLAYER_ID ? AI_ID : PLAYER_ID;
    }
    getCharacter(characterId) {
        const character = CHARACTER_LOOKUP[characterId];
        if (!character) {
            throw new Error(`Unknown character id: ${characterId}`);
        }
        return character;
    }
}
