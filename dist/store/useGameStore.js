import { getCardDefinition } from "../data/cards.js";
import { CHARACTERS } from "../data/characters.js";
import { TALENTS, getTalentCost, isTalentAvailableForSeat } from "../data/talents.js";
import { ShinDoroGame } from "../engine/gameState.js";
const PLAYER_TALENT_SEAT = "first";
const AI_ACTION_DELAY_MS = 520;
const ATTACK_RESOLVE_DELAY_MS = 140;
const ATTACK_FX_TAIL_MS = 220;
const CARD_FX_DURATION_MS = 620;
export function createGameStore({ game = new ShinDoroGame() } = {}) {
    const uiState = {
        setup: {
            playerCharacterId: "character_a",
            aiCharacterId: "character_b",
            selectedTalentIds: []
        },
        mulliganSelection: new Set(),
        selectedAttackerId: null,
        attackFx: null,
        cardFx: null,
        cardFxQueue: [],
        aiTimer: null
    };
    let attackResolveTimer = null;
    let attackFxTimer = null;
    let cardFxTimer = null;
    let fxSerial = 0;
    let onChangeListener = null;
    function notifyChange() {
        onChangeListener?.();
    }
    function getCharacter(characterId) {
        return CHARACTERS.find((character) => character.id === characterId) ?? CHARACTERS[0];
    }
    function getSelectedCharacter() {
        return getCharacter(uiState.setup.playerCharacterId);
    }
    function getTalent(talentId) {
        return TALENTS.find((item) => item.id === talentId);
    }
    function getTalentCostForPlayer(talent) {
        return getTalentCost(talent, PLAYER_TALENT_SEAT);
    }
    function getTalentCount(talentId) {
        return uiState.setup.selectedTalentIds.filter((id) => id === talentId).length;
    }
    function getSpentTalentPoints() {
        return uiState.setup.selectedTalentIds.reduce((sum, talentId) => {
            const talent = getTalent(talentId);
            return sum + (talent ? getTalentCostForPlayer(talent) ?? 0 : 0);
        }, 0);
    }
    function getRemainingTalentPoints() {
        return getSelectedCharacter().talentPoints - getSpentTalentPoints();
    }
    function canAddTalent(talent) {
        const cost = getTalentCostForPlayer(talent);
        return (cost !== null &&
            isTalentAvailableForSeat(talent, PLAYER_TALENT_SEAT) &&
            getRemainingTalentPoints() >= cost &&
            getTalentCount(talent.id) < talent.repeatLimit);
    }
    function resetUiSelections() {
        clearAttackFx();
        uiState.mulliganSelection = new Set();
        uiState.selectedAttackerId = null;
    }
    function buildTargetSet() {
        if (!uiState.selectedAttackerId)
            return new Set();
        return new Set(game.getAttackTargets(uiState.selectedAttackerId).map((target) => target.id));
    }
    function clearAiTimer() {
        if (uiState.aiTimer !== null) {
            window.clearTimeout(uiState.aiTimer);
            uiState.aiTimer = null;
        }
    }
    function clearAttackTimers() {
        if (attackResolveTimer !== null) {
            window.clearTimeout(attackResolveTimer);
            attackResolveTimer = null;
        }
        if (attackFxTimer !== null) {
            window.clearTimeout(attackFxTimer);
            attackFxTimer = null;
        }
    }
    function clearAttackFx() {
        clearAttackTimers();
        uiState.attackFx = null;
    }
    function clearCardFxTimer() {
        if (cardFxTimer !== null) {
            window.clearTimeout(cardFxTimer);
            cardFxTimer = null;
        }
    }
    function clearCardFx() {
        clearCardFxTimer();
        uiState.cardFx = null;
        uiState.cardFxQueue = [];
    }
    function buildVisualSnapshot(state = game.getState()) {
        const buildPlayerSnapshot = (playerId) => {
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
    function createCardFx(kind, ownerId, cardName, targetId = null) {
        fxSerial += 1;
        return {
            id: `card_fx_${fxSerial}`,
            kind,
            ownerId,
            cardName,
            targetId
        };
    }
    function collectCardFx(before, state = game.getState()) {
        const events = [];
        ["P1", "P2"].forEach((playerId) => {
            const player = state.players[playerId];
            const previous = before.players[playerId];
            for (const entry of player.graveyard) {
                if (previous.graveyardIds.has(entry.runtimeId))
                    continue;
                try {
                    const definition = getCardDefinition(entry.id);
                    if (definition.type === "spell") {
                        events.push(createCardFx("spellCast", playerId, entry.name));
                    }
                    else if (definition.type === "trap") {
                        events.push(createCardFx("trapTrigger", playerId, entry.name));
                    }
                }
                catch {
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
    function activateNextCardFx() {
        clearCardFxTimer();
        const next = uiState.cardFxQueue.shift() ?? null;
        uiState.cardFx = next;
        notifyChange();
        if (!next)
            return;
        cardFxTimer = window.setTimeout(() => {
            cardFxTimer = null;
            uiState.cardFx = null;
            notifyChange();
            if (uiState.cardFxQueue.length) {
                activateNextCardFx();
            }
        }, CARD_FX_DURATION_MS);
    }
    function enqueueCardFx(events) {
        if (!events.length)
            return;
        uiState.cardFxQueue.push(...events);
        if (!uiState.cardFx) {
            activateNextCardFx();
        }
    }
    function runWithCardFx(execute, shouldCollect = (result) => Boolean(result)) {
        const before = buildVisualSnapshot();
        const result = execute();
        if (shouldCollect(result)) {
            enqueueCardFx(collectCardFx(before));
        }
        return result;
    }
    function beginAttackFx(targetId, targetType, executeAttack, onChange) {
        const attackerId = uiState.selectedAttackerId;
        if (!attackerId || uiState.attackFx)
            return false;
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
        scheduleAiTurn(onChange) {
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
        dispose() {
            clearAiTimer();
            clearAttackFx();
            clearCardFx();
        },
        selectPlayerCharacter(characterId) {
            uiState.setup.playerCharacterId = characterId;
            uiState.setup.selectedTalentIds = [];
        },
        selectAiCharacter(characterId) {
            uiState.setup.aiCharacterId = characterId;
        },
        addTalent(talentId) {
            const talent = getTalent(talentId);
            if (talent && canAddTalent(talent)) {
                uiState.setup.selectedTalentIds.push(talent.id);
            }
        },
        removeTalent(talentId) {
            const index = uiState.setup.selectedTalentIds.lastIndexOf(talentId);
            if (index >= 0) {
                uiState.setup.selectedTalentIds.splice(index, 1);
            }
        },
        startGame() {
            game.setupMatch({
                playerCharacterId: uiState.setup.playerCharacterId,
                aiCharacterId: uiState.setup.aiCharacterId,
                playerTalentIds: uiState.setup.selectedTalentIds
            });
            resetUiSelections();
            clearCardFx();
        },
        toggleMulliganCard(runtimeId) {
            if (uiState.mulliganSelection.has(runtimeId)) {
                uiState.mulliganSelection.delete(runtimeId);
            }
            else {
                uiState.mulliganSelection.add(runtimeId);
            }
        },
        clearMulliganSelection() {
            uiState.mulliganSelection.clear();
        },
        confirmMulligan() {
            const player = game.getState().players.P1;
            const indices = player.hand
                .map((card, index) => ({ runtimeId: card.runtimeId, index }))
                .filter((item) => uiState.mulliganSelection.has(item.runtimeId))
                .map((item) => item.index);
            uiState.mulliganSelection.clear();
            game.completePlayerMulligan(indices);
        },
        restart() {
            clearAiTimer();
            clearAttackFx();
            clearCardFx();
            game.reset();
            resetUiSelections();
            uiState.setup.selectedTalentIds = [];
        },
        resolvePendingChoice(payload) {
            game.handlePendingChoice(payload);
        },
        cancelAttacker() {
            clearAttackFx();
            uiState.selectedAttackerId = null;
        },
        toggleAttacker(minionId) {
            if (uiState.attackFx)
                return;
            uiState.selectedAttackerId = uiState.selectedAttackerId === minionId ? null : minionId;
        },
        playCard(runtimeId) {
            clearAttackFx();
            const didPlay = runWithCardFx(() => game.playCard(runtimeId));
            if (didPlay) {
                uiState.selectedAttackerId = null;
            }
            return didPlay;
        },
        attackMinion(minionId, onChange) {
            return beginAttackFx(minionId, "minion", (attackerId) => game.attack(attackerId, minionId, "minion"), onChange);
        },
        attackHero(heroId, onChange) {
            return beginAttackFx(heroId, "hero", (attackerId) => game.attack(attackerId, heroId, "hero"), onChange);
        },
        endTurn() {
            clearAttackFx();
            uiState.selectedAttackerId = null;
            return game.endTurn();
        }
    };
}
