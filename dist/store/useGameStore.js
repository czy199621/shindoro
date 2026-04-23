import { CHARACTERS } from "../data/characters.js";
import { TALENTS, getTalentCost, isTalentAvailableForSeat } from "../data/talents.js";
import { ShinDoroGame } from "../engine/gameState.js";
const PLAYER_TALENT_SEAT = "first";
export function createGameStore({ game = new ShinDoroGame() } = {}) {
    const uiState = {
        setup: {
            playerCharacterId: "character_a",
            aiCharacterId: "character_b",
            selectedTalentIds: []
        },
        mulliganSelection: new Set(),
        selectedAttackerId: null,
        aiTimer: null
    };
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
                    game.runAiTurn();
                    uiState.selectedAttackerId = null;
                    onChange();
                }, 500);
            }
        },
        dispose() {
            clearAiTimer();
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
            game.reset();
            resetUiSelections();
            uiState.setup.selectedTalentIds = [];
        },
        resolvePendingChoice(payload) {
            game.handlePendingChoice(payload);
        },
        cancelAttacker() {
            uiState.selectedAttackerId = null;
        },
        toggleAttacker(minionId) {
            uiState.selectedAttackerId = uiState.selectedAttackerId === minionId ? null : minionId;
        },
        playCard(runtimeId) {
            const didPlay = game.playCard(runtimeId);
            if (didPlay) {
                uiState.selectedAttackerId = null;
            }
            return didPlay;
        },
        attackMinion(minionId) {
            if (!uiState.selectedAttackerId)
                return false;
            const didAttack = game.attack(uiState.selectedAttackerId, minionId, "minion");
            if (didAttack) {
                uiState.selectedAttackerId = null;
            }
            return didAttack;
        },
        attackHero(heroId) {
            if (!uiState.selectedAttackerId)
                return false;
            const didAttack = game.attack(uiState.selectedAttackerId, heroId, "hero");
            if (didAttack) {
                uiState.selectedAttackerId = null;
            }
            return didAttack;
        },
        endTurn() {
            uiState.selectedAttackerId = null;
            return game.endTurn();
        }
    };
}
