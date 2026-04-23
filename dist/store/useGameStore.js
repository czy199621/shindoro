import { CHARACTERS } from "../data/characters.js";
import { TALENTS, getTalentCost, isTalentAvailableForSeat } from "../data/talents.js";
import { ShinDoroGame } from "../engine/gameState.js";
const PLAYER_TALENT_SEAT = "first";
const ATTACK_RESOLVE_DELAY_MS = 140;
const ATTACK_FX_TAIL_MS = 220;
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
        aiTimer: null
    };
    let attackResolveTimer = null;
    let attackFxTimer = null;
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
            clearAiTimer();
            const state = game.getState();
            if (state.currentPlayer === "P2" && (state.phase === "mainTurn" || state.phase === "combat") && !state.winner) {
                uiState.aiTimer = window.setTimeout(() => {
                    clearAttackFx();
                    game.runAiTurn();
                    uiState.selectedAttackerId = null;
                    onChange();
                }, 500);
            }
        },
        dispose() {
            clearAiTimer();
            clearAttackFx();
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
            const didPlay = game.playCard(runtimeId);
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
