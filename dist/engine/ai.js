import { getCardDefinition } from "../data/cards.js";
import { CHARACTER_LOOKUP } from "../data/characters.js";
import { TALENT_LOOKUP, getTalentCost } from "../data/talents.js";
export function chooseAiTalentIds(characterId, seat = "second") {
    const presets = {
        character_a: ["second_counterpush", "opening_insight", "spell_focus", "vitality_ritual"],
        character_b: ["opening_insight", "wide_grip", "desperate_recovery", "first_guardrail"],
        character_c: ["mana_favor", "wide_grip", "burst_memory", "giant_stride"],
        character_d: ["vitality_ritual", "giant_stride", "spell_focus", "burst_memory"],
        character_e: ["second_counterpush", "swift_hatch", "spell_focus", "desperate_recovery"],
        character_f: ["opening_insight", "wide_grip", "foretold_scroll", "first_guardrail"]
    };
    const budget = CHARACTER_LOOKUP[characterId]?.talentPoints ?? 0;
    let spent = 0;
    return (presets[characterId] ?? ["opening_insight"]).filter((talentId) => {
        const talent = TALENT_LOOKUP[talentId];
        if (!talent)
            return false;
        const cost = getTalentCost(talent, seat);
        if (cost === null || spent + cost > budget)
            return false;
        spent += cost;
        return true;
    });
}
export function shouldAiUseJumpSlot(state, playerId) {
    const me = state.players[playerId];
    const opp = state.players[playerId === "P1" ? "P2" : "P1"];
    return opp.hp <= 8 || me.board.length >= opp.board.length || me.jumpSlot >= 12;
}
export function shouldAiUseGodDrawSlot(state, playerId) {
    const me = state.players[playerId];
    return me.hand.length <= 3 || me.godDrawSlot >= 12 || me.hp <= 10;
}
export function chooseAiDeckCardForGodDraw(state, playerId) {
    const me = state.players[playerId];
    const opp = state.players[playerId === "P1" ? "P2" : "P1"];
    if (opp.board.length) {
        const removal = me.deck.find((card) => ["arc_bolt", "soul_shatter", "cinder_storm", "judgment_beam"].includes(card.id));
        if (removal)
            return removal.id;
    }
    if (me.hp <= 10) {
        const healing = me.deck.find((card) => ["healing_prayer", "divine_intervention", "grave_knight", "dawn_healer"].includes(card.id));
        if (healing)
            return healing.id;
    }
    const draw = me.deck.find((card) => ["inspiration", "novice_mage", "archivist_owl", "sage_archive"].includes(card.id));
    if (draw)
        return draw.id;
    return me.deck[0]?.id ?? null;
}
export function chooseAiReserveCard(state, playerId) {
    const me = state.players[playerId];
    const opp = state.players[playerId === "P1" ? "P2" : "P1"];
    if (opp.board.length >= 2)
        return "judgment_beam";
    if (me.hp <= 10)
        return "divine_intervention";
    return "miracle_guardian";
}
function evaluateCard(game, playerId, card) {
    const me = game.getPlayer(playerId);
    const opp = game.getOpponent(playerId);
    let score = 0.1;
    if (card.type === "minion") {
        score += (card.attack ?? 0) * 1.2 + (card.health ?? 0) * 0.85;
        if (card.tags?.includes("rush"))
            score += 2.4;
        if (me.board.length >= 6)
            score -= 6;
    }
    if (card.type === "persistent") {
        score += (card.threat ?? 0) * 1.4;
        if (card.id === "sage_archive")
            score += 2.5;
        if (card.id === "underdog_shrine" && me.hp <= opp.hp)
            score += 3;
    }
    if (card.type === "trap") {
        score += 2.2;
        if (card.id === "mirror_wall" && opp.hand.some((item) => item.type === "spell"))
            score += 2;
    }
    for (const effect of card.effects ?? []) {
        const action = effect.action;
        if (action.type === "damage") {
            if (action.target === "enemyHero") {
                score += action.amount * 2;
                if (opp.hp <= action.amount + 3)
                    score += 7;
            }
            else if (action.target === "allEnemyMinions") {
                score += opp.board.length * action.amount * 1.4;
            }
            else if (action.target === "strongestEnemyMinion") {
                const target = [...opp.board].sort((left, right) => right.attack - left.attack)[0];
                if (target) {
                    score += Math.min(action.amount, target.health) * 2.2;
                    if (target.health <= action.amount)
                        score += target.attack + 2;
                }
            }
        }
        if (action.type === "heal" && action.target === "selfHero") {
            score += me.hp <= 10 ? action.amount * 1.8 : action.amount * 0.6;
        }
        if (action.type === "draw") {
            score += action.count * 2.1;
        }
        if (action.type === "buff") {
            score += me.board.length * (((action.atk ?? 0) * 1.5) + ((action.hp ?? 0) * 1.2));
        }
        if (action.type === "addSlot") {
            score += action.amount * 1.8;
        }
        if (action.type === "destroy" && opp.board.length) {
            const attacks = opp.board.map((minion) => minion.attack);
            score += 6 + (attacks.length ? Math.max(...attacks) : 0);
        }
        if (action.type === "gainMana") {
            score += me.hand.length > 0 ? 2.8 : 0.4;
        }
    }
    score -= card.currentCost * 0.25;
    return score;
}
function evaluateAttack(game, playerId, attacker, target) {
    const opp = game.getOpponent(playerId);
    if (target.type === "hero") {
        let score = attacker.attack * 1.4;
        if (opp.hp <= attacker.attack)
            score += 15;
        return score;
    }
    const defender = opp.board.find((minion) => minion.instanceId === target.id);
    if (!defender)
        return -999;
    const wouldKill = defender.health <= attacker.attack;
    const wouldLose = attacker.health <= defender.attack;
    let score = 0;
    if (wouldKill)
        score += defender.attack + defender.health * 0.8 + 2;
    if (!wouldLose)
        score += attacker.attack * 0.5 + attacker.health * 0.4;
    if (wouldLose)
        score -= attacker.attack + attacker.health * 0.7;
    if (defender.attack >= attacker.health)
        score += 1.5;
    return score;
}
export function chooseAiAction(game, playerId) {
    const me = game.getPlayer(playerId);
    const playableCards = game.state.phase === "mainTurn"
        ? me.hand
            .map((card, index) => ({ type: "playCard", index, score: evaluateCard(game, playerId, card), card }))
            .filter(({ card }) => card.currentCost <= me.mana)
        : [];
    const attacks = [];
    for (const attacker of game.getReadyAttackers(playerId)) {
        for (const target of game.getAIAttackTargets(attacker.instanceId, playerId)) {
            attacks.push({
                type: "attack",
                attackerId: attacker.instanceId,
                targetId: target.id,
                targetType: target.type,
                score: evaluateAttack(game, playerId, attacker, target)
            });
        }
    }
    const allActions = [...playableCards, ...attacks].sort((left, right) => right.score - left.score);
    if (!allActions.length)
        return { type: "endTurn" };
    const best = allActions[0];
    if (best.score < 0.9)
        return { type: "endTurn" };
    return best;
}
export function describeCard(cardId) {
    return getCardDefinition(cardId).name;
}
