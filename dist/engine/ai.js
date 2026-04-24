import { getCardDefinition } from "../data/cards.js";
import { CHARACTER_LOOKUP } from "../data/characters.js";
import { TALENTS, TALENT_LOOKUP, getTalentCost } from "../data/talents.js";
import { boardAttack, boardThreat } from "./rules.js";
const PLAYER_ID = "P1";
const AI_ID = "P2";
const REMOVAL_IDS = new Set(["arc_bolt", "soul_shatter", "cinder_storm", "judgment_beam", "dusk_assassin"]);
const HEAL_IDS = new Set(["healing_prayer", "divine_intervention", "grave_knight", "dawn_healer", "shield_doll", "top_donor"]);
const DRAW_IDS = new Set(["inspiration", "novice_mage", "archivist_owl", "mirror_sage", "sage_archive", "pact_weaver"]);
const FACE_DAMAGE_IDS = new Set(["burn", "ashen_ranger", "judgment_beam"]);
const JUMP_IDS = new Set(["tactical_insight", "blade_dancer"]);
const GOD_DRAW_IDS = new Set(["shrine_guard", "desperate_gamble", "pact_weaver", "underdog_shrine"]);
const BOARD_BUFF_IDS = new Set(["battlefield_bard", "tactics_scroll", "war_banner"]);
const GUARD_IDS = new Set(["landmine_girl", "day_off", "dorm_matron", "iron_rice_bowl", "three_phase_plug", "top_donor"]);
const DEFAULT_PROFILE = {
    talentPriority: [
        "opening_insight",
        "mana_favor",
        "wide_grip",
        "spell_focus",
        "vitality_ritual",
        "second_counterpush",
        "first_guardrail"
    ],
    mulliganMaxCost: 3,
    mulliganKeepIds: ["novice_mage", "tactical_insight", "arc_bolt"],
    keepRemovalCost: 3,
    actionThreshold: 0.9,
    minionAttack: 1.15,
    minionHealth: 0.85,
    rush: 2.2,
    guard: 0.9,
    defensiveTag: 0.8,
    faceDamage: 2.0,
    removal: 2.2,
    aoe: 1.35,
    heal: 0.9,
    draw: 2.0,
    buff: 1.2,
    jumpSlot: 1.7,
    godDrawSlot: 1.7,
    persistent: 1.4,
    trap: 2.0,
    attackFace: 1.35,
    trade: 1.25,
    preserveMinion: 0.85,
    godDrawHandThreshold: 3,
    godDrawHpThreshold: 10,
    preferredGodDrawIds: ["arc_bolt", "soul_shatter", "inspiration", "novice_mage"],
    preferredReserveIds: ["judgment_beam", "miracle_guardian", "divine_intervention"]
};
const AI_PROFILES = {
    character_a: {
        ...DEFAULT_PROFILE,
        talentPriority: ["second_counterpush", "spell_focus", "opening_insight", "mana_favor", "vitality_ritual"],
        mulliganMaxCost: 3,
        mulliganKeepIds: ["ember_wolf", "burn", "tactical_insight", "blade_dancer", "storm_lancer", "arc_bolt"],
        keepRemovalCost: 2,
        minionAttack: 1.35,
        rush: 3.1,
        faceDamage: 2.9,
        heal: 0.45,
        draw: 1.5,
        jumpSlot: 3.0,
        godDrawSlot: 1.1,
        attackFace: 1.9,
        trade: 0.85,
        preserveMinion: 0.55,
        godDrawHandThreshold: 2,
        preferredGodDrawIds: ["burn", "ashen_ranger", "tactical_insight", "blade_dancer", "storm_lancer", "judgment_beam"],
        preferredReserveIds: ["judgment_beam", "miracle_guardian", "top_donor"]
    },
    character_b: {
        ...DEFAULT_PROFILE,
        talentPriority: ["opening_insight", "wide_grip", "desperate_recovery", "first_guardrail", "vitality_ritual"],
        mulliganMaxCost: 4,
        mulliganKeepIds: ["shrine_guard", "desperate_gamble", "pact_weaver", "underdog_shrine", "sage_archive", "arc_bolt"],
        minionAttack: 0.9,
        minionHealth: 1.0,
        guard: 1.5,
        faceDamage: 1.35,
        removal: 2.7,
        heal: 1.55,
        draw: 2.8,
        godDrawSlot: 2.8,
        persistent: 2.2,
        trap: 2.5,
        attackFace: 1.0,
        trade: 1.55,
        preserveMinion: 1.1,
        godDrawHandThreshold: 5,
        godDrawHpThreshold: 14,
        preferredGodDrawIds: ["sage_archive", "inspiration", "divine_intervention", "soul_shatter", "cinder_storm", "pact_weaver"],
        preferredReserveIds: ["miracle_guardian", "top_donor", "judgment_beam"]
    },
    character_c: {
        ...DEFAULT_PROFILE,
        talentPriority: ["mana_favor", "wide_grip", "burst_memory", "giant_stride", "second_counterpush"],
        mulliganMaxCost: 3,
        mulliganKeepIds: ["ember_wolf", "shrine_guard", "shield_doll", "novice_mage", "battlefield_bard", "war_banner", "tactics_scroll"],
        minionAttack: 1.2,
        minionHealth: 1.1,
        guard: 1.15,
        faceDamage: 1.55,
        removal: 1.6,
        draw: 1.8,
        buff: 2.2,
        jumpSlot: 1.8,
        godDrawSlot: 1.5,
        persistent: 2.0,
        attackFace: 1.25,
        trade: 1.05,
        preserveMinion: 1.0,
        preferredGodDrawIds: ["war_banner", "battlefield_bard", "tactics_scroll", "storm_lancer", "iron_colossus", "miracle_guardian"],
        preferredReserveIds: ["miracle_guardian", "top_donor", "judgment_beam"]
    },
    character_d: {
        ...DEFAULT_PROFILE,
        talentPriority: ["vitality_ritual", "spell_focus", "burst_memory", "opening_insight", "giant_stride"],
        mulliganMaxCost: 3,
        mulliganKeepIds: ["tactical_insight", "blade_dancer", "arc_bolt", "soul_shatter", "shield_doll", "dawn_healer"],
        minionAttack: 1.05,
        minionHealth: 0.95,
        faceDamage: 2.15,
        removal: 3.0,
        aoe: 1.55,
        heal: 1.5,
        jumpSlot: 2.25,
        godDrawSlot: 1.2,
        attackFace: 1.35,
        trade: 1.65,
        preserveMinion: 0.9,
        godDrawHpThreshold: 13,
        preferredGodDrawIds: ["soul_shatter", "judgment_beam", "divine_intervention", "arc_bolt", "tactical_insight"],
        preferredReserveIds: ["judgment_beam", "iron_rice_bowl", "miracle_guardian"]
    },
    character_e: {
        ...DEFAULT_PROFILE,
        talentPriority: ["second_counterpush", "swift_hatch", "spell_focus", "desperate_recovery", "vitality_ritual"],
        mulliganMaxCost: 3,
        mulliganKeepIds: ["ember_wolf", "tactical_insight", "blade_dancer", "storm_lancer", "mirror_wall", "ambush_sigil"],
        minionAttack: 1.3,
        rush: 3.0,
        faceDamage: 2.2,
        removal: 2.0,
        heal: 0.9,
        draw: 1.7,
        buff: 1.55,
        jumpSlot: 2.65,
        godDrawSlot: 1.35,
        trap: 2.6,
        attackFace: 1.65,
        trade: 1.0,
        preserveMinion: 0.75,
        preferredGodDrawIds: ["storm_lancer", "battlefield_bard", "tactics_scroll", "burn", "judgment_beam"],
        preferredReserveIds: ["judgment_beam", "miracle_guardian", "divine_intervention"]
    },
    character_f: {
        ...DEFAULT_PROFILE,
        talentPriority: ["opening_insight", "foretold_scroll", "wide_grip", "first_guardrail", "vitality_ritual"],
        mulliganMaxCost: 4,
        mulliganKeepIds: ["tactical_insight", "blade_dancer", "landmine_girl", "day_off", "dorm_matron", "arc_bolt", "healing_prayer"],
        minionAttack: 0.75,
        minionHealth: 1.25,
        rush: 1.4,
        guard: 2.5,
        defensiveTag: 2.0,
        faceDamage: 1.0,
        removal: 2.6,
        aoe: 1.7,
        heal: 1.85,
        draw: 2.1,
        jumpSlot: 2.55,
        godDrawSlot: 1.1,
        persistent: 1.6,
        trap: 2.35,
        attackFace: 0.85,
        trade: 1.75,
        preserveMinion: 1.35,
        godDrawHandThreshold: 4,
        godDrawHpThreshold: 15,
        preferredGodDrawIds: ["tactical_insight", "blade_dancer", "landmine_girl", "dorm_matron", "divine_intervention", "soul_shatter"],
        preferredReserveIds: ["top_donor", "divine_intervention", "judgment_beam"]
    }
};
function getOpponentId(playerId) {
    return playerId === PLAYER_ID ? AI_ID : PLAYER_ID;
}
function getProfile(characterId) {
    return AI_PROFILES[characterId] ?? DEFAULT_PROFILE;
}
function getPlayerProfile(state, playerId) {
    return getProfile(state.players[playerId].character);
}
function clampScore(value) {
    return Number.isFinite(value) ? value : 0;
}
function countReadyAttackers(player) {
    return player.board.filter((minion) => minion.canAttack).length;
}
function hasHandCard(player, ids) {
    return player.hand.some((card) => ids.has(card.id));
}
function cardPriority(card, ids) {
    const index = ids.indexOf(card.id);
    return index < 0 ? 0 : Math.max(0.5, ids.length - index);
}
export function chooseAiTalentIds(characterId, seat = "second") {
    const profile = getProfile(characterId);
    const budget = CHARACTER_LOOKUP[characterId]?.talentPoints ?? 0;
    const priority = [...profile.talentPriority, ...TALENTS.map((talent) => talent.id)];
    const selected = [];
    const counts = new Map();
    let spent = 0;
    for (const talentId of priority) {
        const talent = TALENT_LOOKUP[talentId];
        if (!talent)
            continue;
        const cost = getTalentCost(talent, seat);
        if (cost === null || spent + cost > budget)
            continue;
        if ((counts.get(talent.id) ?? 0) >= talent.repeatLimit)
            continue;
        selected.push(talent.id);
        counts.set(talent.id, (counts.get(talent.id) ?? 0) + 1);
        spent += cost;
    }
    return selected;
}
function shouldKeepOpeningCard(state, playerId, card) {
    const profile = getPlayerProfile(state, playerId);
    if (card.id === "coin")
        return true;
    if (profile.mulliganKeepIds.includes(card.id))
        return true;
    if (card.currentCost <= profile.mulliganMaxCost && card.type === "minion")
        return true;
    if (card.currentCost <= profile.mulliganMaxCost && (card.type === "spell" || card.type === "trap")) {
        return !HEAL_IDS.has(card.id) || profile.heal >= 1.4;
    }
    if (REMOVAL_IDS.has(card.id) && card.currentCost <= profile.keepRemovalCost)
        return true;
    if (card.type === "persistent" && card.currentCost <= 4 && profile.persistent >= 1.8)
        return true;
    return false;
}
export function chooseAiMulliganIndices(state, playerId) {
    return state.players[playerId].hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => !shouldKeepOpeningCard(state, playerId, card))
        .map(({ index }) => index);
}
export function shouldAiUseJumpSlot(state, playerId) {
    const me = state.players[playerId];
    const opp = state.players[getOpponentId(playerId)];
    const profile = getPlayerProfile(state, playerId);
    const myAttack = boardAttack(me);
    if (me.jumpSlot >= 12)
        return true;
    if (opp.hp <= myAttack + 3 && myAttack > 0)
        return true;
    switch (me.character) {
        case "character_a":
            return opp.hp <= 10 || me.board.some((minion) => minion.tags.includes("rush"));
        case "character_b":
            return me.hand.length <= 4 || me.hp <= 10;
        case "character_c":
            return me.board.length >= 2 && myAttack >= 4;
        case "character_d":
            return opp.board.length > 0 || opp.hp <= 10;
        case "character_e":
            return myAttack > 0 && (opp.board.some((minion) => minion.tags.includes("guard")) || opp.hp <= myAttack + 5);
        case "character_f":
            return opp.deck.length <= 24 || me.hp <= 10 || me.hand.length <= 2;
        default:
            return opp.hp <= 8 || me.board.length >= opp.board.length || profile.jumpSlot >= 2.4;
    }
}
export function shouldAiUseGodDrawSlot(state, playerId) {
    const me = state.players[playerId];
    const opp = state.players[getOpponentId(playerId)];
    const profile = getPlayerProfile(state, playerId);
    const danger = boardAttack(opp) >= Math.max(1, me.hp - 4);
    return (me.godDrawSlot >= 12 ||
        me.hand.length <= profile.godDrawHandThreshold ||
        me.hp <= profile.godDrawHpThreshold ||
        (opp.board.length > 0 && !hasHandCard(me, REMOVAL_IDS)) ||
        (danger && !hasHandCard(me, HEAL_IDS)));
}
function scoreMinionDamage(action, amount, opp, profile) {
    if (action.target === "allEnemyMinions") {
        const targets = opp.board.length;
        const kills = opp.board.filter((minion) => minion.health <= amount).length;
        return targets * amount * profile.aoe + kills * 2.2;
    }
    if (action.target === "strongestEnemyMinion" || action.target === "weakestEnemyMinion") {
        const sorted = [...opp.board].sort((left, right) => action.target === "strongestEnemyMinion" ? right.attack - left.attack : left.attack - right.attack);
        const target = sorted[0];
        if (!target)
            return 0;
        const killBonus = target.health <= amount ? target.attack + (target.threat ?? 0) + 2 : 0;
        return Math.min(amount, target.health) * profile.removal + killBonus;
    }
    return 0;
}
function scoreHeal(me, amount, profile) {
    const missingHp = Math.max(0, me.maxHp - me.hp);
    if (missingHp === 0)
        return 0.15 * amount;
    const urgency = me.hp <= 10 ? 1.8 : me.hp <= 14 ? 1.25 : 0.75;
    return Math.min(amount, missingHp) * profile.heal * urgency;
}
function scoreSlotGain(state, playerId, slot, amount, profile) {
    const player = state.players[playerId];
    const current = slot === "jump" ? player.jumpSlot : player.godDrawSlot;
    const weight = slot === "jump" ? profile.jumpSlot : profile.godDrawSlot;
    const after = Math.min(13, current + amount);
    let score = amount * weight;
    if (current < 10 && after >= 10)
        score += 4.5;
    if (current < 13 && after >= 13)
        score += 6.5;
    return score;
}
function scoreEffectAction(state, playerId, card, action) {
    const me = state.players[playerId];
    const opp = state.players[getOpponentId(playerId)];
    const profile = getPlayerProfile(state, playerId);
    switch (action.type) {
        case "damage": {
            const amount = action.amount + (card.type === "spell" ? me.temporaryFlags.spellDamageBonus : 0);
            if (action.target === "enemyHero") {
                let score = amount * profile.faceDamage;
                if (opp.hp <= amount + boardAttack(me))
                    score += 18;
                if (FACE_DAMAGE_IDS.has(card.id))
                    score += profile.faceDamage;
                return score;
            }
            return scoreMinionDamage(action, amount, opp, profile);
        }
        case "heal":
            return action.target === "selfHero" ? scoreHeal(me, action.amount, profile) : 0;
        case "draw": {
            const handRoom = Math.max(0, me.handLimit - me.hand.length);
            const scarcity = me.hand.length <= 3 ? 1.45 : me.hand.length <= 5 ? 1.1 : 0.75;
            return Math.min(action.count, handRoom) * profile.draw * scarcity;
        }
        case "buff": {
            const boardCount = action.target === "allFriendlyMinionsExceptSource" ? Math.max(0, me.board.length) : me.board.length;
            const readyBonus = countReadyAttackers(me) > 0 ? 1.25 : 1;
            return boardCount * (((action.atk ?? 0) * 1.45 + (action.hp ?? 0) * 1.15) * profile.buff) * readyBonus;
        }
        case "destroy": {
            if (!opp.board.length)
                return 0;
            const target = [...opp.board].sort((left, right) => right.attack - left.attack)[0];
            return 5 + (target?.attack ?? 0) * profile.removal + (target?.threat ?? 0);
        }
        case "addSlot":
            return scoreSlotGain(state, playerId, action.slot, action.amount, profile);
        case "gainMana": {
            const enabled = me.hand.some((handCard) => handCard.runtimeId !== card.runtimeId &&
                handCard.currentCost > me.mana &&
                handCard.currentCost <= me.mana + action.amount &&
                (handCard.type !== "minion" || me.board.length < 7));
            return enabled ? 5.2 : 0.8;
        }
        case "discard":
            return action.target === "opponent" ? action.count * 1.7 : -action.count * 2;
        case "millDeck":
            return action.count * (me.character === "character_f" ? 1.2 : 0.35);
        case "applyOpponentNextTurnManaPenalty":
            return action.amount * (me.character === "character_e" ? 2.3 : 1.25);
        case "setIgnoreGuard":
            return opp.board.some((minion) => minion.tags.includes("guard")) && boardAttack(me) > 0 ? 5.5 : 1.2;
        case "summon":
        case "addCardToHand":
            return 2.4 * (action.count ?? 1);
        case "discountNextDraw":
            return action.amount * 1.15;
        case "setTopDeck":
            return 1.4;
        case "setMillOnDamageTaken":
            return me.character === "character_f" ? 4 : 1;
        case "exilePriorityEnemyMinionAndDamageHero":
            return opp.board.length ? 8 + boardThreat(opp, me) * 0.5 : 0;
        case "grantAdjacentGuard":
            return profile.guard * Math.min(2, me.board.length) * 1.4;
        case "buffSelfIfHeroHpBelow":
            return me.hp < action.threshold ? ((action.atk ?? 0) * 1.5 + (action.hp ?? 0) * 1.1) : 0;
        default:
            return 0;
    }
}
function evaluateCardState(state, playerId, card, ignoreCost = false) {
    const me = state.players[playerId];
    const opp = state.players[getOpponentId(playerId)];
    const profile = getPlayerProfile(state, playerId);
    let score = 0.1 + cardPriority(card, profile.preferredGodDrawIds) * 0.45;
    if (card.type === "minion") {
        score += (card.attack ?? 0) * profile.minionAttack + (card.health ?? 0) * profile.minionHealth;
        score += (card.threat ?? 0) * 0.25;
        if (card.tags?.includes("rush"))
            score += profile.rush;
        if (card.tags?.includes("guard"))
            score += profile.guard;
        if (card.tags?.includes("menace") || card.tags?.includes("magicRes"))
            score += profile.defensiveTag;
        if (me.board.length >= 6)
            score -= 7;
    }
    if (card.type === "persistent") {
        score += (card.threat ?? 0) * profile.persistent;
        if (card.id === "sage_archive")
            score += profile.draw * 1.3;
        if (card.id === "underdog_shrine" && me.hp <= opp.hp)
            score += profile.godDrawSlot * 1.5;
        if (card.id === "war_banner" && me.board.length >= 2)
            score += profile.buff * me.board.length;
    }
    if (card.type === "trap") {
        score += profile.trap;
        if (card.id === "mirror_wall" && opp.hand.some((item) => item.type === "spell"))
            score += 2.2;
        if (card.id === "ambush_sigil" && opp.hand.some((item) => item.type === "minion"))
            score += 1.6;
    }
    if (REMOVAL_IDS.has(card.id) && opp.board.length)
        score += profile.removal;
    if (HEAL_IDS.has(card.id))
        score += me.hp <= 14 ? profile.heal : 0;
    if (DRAW_IDS.has(card.id))
        score += me.hand.length <= 4 ? profile.draw : profile.draw * 0.45;
    if (JUMP_IDS.has(card.id))
        score += profile.jumpSlot;
    if (GOD_DRAW_IDS.has(card.id))
        score += profile.godDrawSlot;
    if (BOARD_BUFF_IDS.has(card.id) && me.board.length)
        score += profile.buff * me.board.length;
    if (GUARD_IDS.has(card.id))
        score += profile.guard;
    for (const effect of card.effects ?? []) {
        score += scoreEffectAction(state, playerId, card, effect.action);
    }
    const pressure = boardAttack(opp);
    if (pressure >= me.hp - 4) {
        if (REMOVAL_IDS.has(card.id))
            score += 4;
        if (HEAL_IDS.has(card.id))
            score += 3;
        if (card.tags?.includes("guard"))
            score += 2.5;
    }
    if (!ignoreCost) {
        score -= card.currentCost * 0.22;
    }
    return clampScore(score);
}
function chooseBestCardId(cards, state, playerId, reserve = false) {
    if (!cards.length)
        return null;
    const profile = getPlayerProfile(state, playerId);
    const opp = state.players[getOpponentId(playerId)];
    const me = state.players[playerId];
    const scored = cards
        .map((card) => {
        let score = evaluateCardState(state, playerId, card, true);
        score += cardPriority(card, reserve ? profile.preferredReserveIds : profile.preferredGodDrawIds);
        if (opp.board.length && REMOVAL_IDS.has(card.id))
            score += 7;
        if (me.hp <= profile.godDrawHpThreshold && HEAL_IDS.has(card.id))
            score += 7;
        if (opp.hp <= boardAttack(me) + 5 && FACE_DAMAGE_IDS.has(card.id))
            score += 8;
        if (me.character === "character_f" && (JUMP_IDS.has(card.id) || GUARD_IDS.has(card.id)))
            score += 5;
        return { card, score };
    })
        .sort((left, right) => right.score - left.score);
    return scored[0]?.card.id ?? null;
}
export function chooseAiDeckCardForGodDraw(state, playerId) {
    return chooseBestCardId(state.players[playerId].deck, state, playerId, false);
}
export function chooseAiReserveCard(state, playerId) {
    return chooseBestCardId(state.players[playerId].reserveDeck, state, playerId, true) ?? "miracle_guardian";
}
function evaluateAttack(game, playerId, attacker, target) {
    const state = game.state;
    const me = game.getPlayer(playerId);
    const opp = game.getOpponent(playerId);
    const profile = getPlayerProfile(state, playerId);
    const attackerValue = attacker.attack * 1.15 + attacker.health * 0.8 + (attacker.threat ?? 0) * 0.35;
    if (target.type === "hero") {
        let score = attacker.attack * profile.attackFace;
        if (opp.hp <= attacker.attack)
            score += 80;
        if (opp.hp <= attacker.attack + 4)
            score += 7;
        if (boardAttack(opp) >= me.hp && me.character !== "character_a")
            score -= 5;
        if (attacker.tags.includes("guard") && profile.guard >= 1.8 && opp.hp > attacker.attack) {
            score -= attackerValue * 0.45;
        }
        return score;
    }
    const defender = opp.board.find((minion) => minion.instanceId === target.id);
    if (!defender)
        return -999;
    const wouldKill = defender.health <= attacker.attack;
    const wouldLose = attacker.health <= defender.attack;
    const defenderValue = defender.attack * 1.25 +
        defender.health * 0.65 +
        (defender.threat ?? 0) * 0.8 +
        (defender.tags.includes("menace") ? 3 : 0) +
        (defender.tags.includes("guard") ? 1.8 : 0) +
        (defender.tags.includes("magicRes") ? 1.2 : 0);
    let score = 0;
    if (wouldKill)
        score += defenderValue * profile.trade + 2.5;
    if (!wouldKill)
        score += Math.min(attacker.attack, defender.health) * 0.65;
    if (wouldLose)
        score -= attackerValue * profile.preserveMinion;
    if (!wouldLose)
        score += attackerValue * 0.32;
    if (defender.attack >= me.hp)
        score += 12;
    if (defender.attack >= attacker.health && wouldKill)
        score += 2;
    if (defender.tags.includes("guard") && profile.attackFace > profile.trade)
        score += 1.5;
    return score;
}
export function chooseAiAction(game, playerId) {
    const me = game.getPlayer(playerId);
    const profile = getPlayerProfile(game.state, playerId);
    const playableCards = game.state.phase === "mainTurn"
        ? me.hand
            .map((card, index) => ({
            type: "playCard",
            index,
            score: evaluateCardState(game.state, playerId, card),
            card
        }))
            .filter(({ card }) => card.currentCost <= me.mana && (card.type !== "minion" || me.board.length < 7))
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
    if (best.score < profile.actionThreshold)
        return { type: "endTurn" };
    return best;
}
export function describeCard(cardId) {
    return getCardDefinition(cardId).name;
}
