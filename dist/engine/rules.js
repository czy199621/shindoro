let runtimeCounter = 0;
export function createRuntimeId(prefix = "id") {
    runtimeCounter += 1;
    return `${prefix}_${runtimeCounter}`;
}
export function shuffle(items, rng = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(rng() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export function createRuntimeCard(cardDefinition) {
    return {
        ...structuredClone(cardDefinition),
        runtimeId: createRuntimeId(cardDefinition.type),
        baseCost: cardDefinition.cost,
        currentCost: cardDefinition.cost
    };
}
export function createMinionInstance(card, ownerId) {
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
export function createPersistentInstance(card, ownerId) {
    return {
        instanceId: createRuntimeId(card.type),
        ownerId,
        sourceCardId: card.id,
        name: card.name,
        threat: card.threat ?? 0,
        description: card.description,
        effects: structuredClone(card.effects ?? []),
        type: card.type
    };
}
export function defaultThreatForStats(attack, health) {
    return Math.floor(attack + health / 2);
}
export function boardAttack(player) {
    return player.board.reduce((sum, minion) => sum + Math.max(0, minion.attack), 0);
}
export function boardThreat(player) {
    const minionThreat = player.board.reduce((sum, minion) => sum + (minion.threat ?? defaultThreatForStats(minion.attack, minion.health)), 0);
    const persistentThreat = player.persistents.reduce((sum, card) => sum + (card.threat ?? 0), 0);
    return minionThreat + persistentThreat;
}
export function getAdvantageBreakdown(me, opp) {
    let handScore = me.hand.length - opp.hand.length;
    if (me.hand.length > 7 || opp.hand.length > 7) {
        handScore *= 2;
    }
    const hpDiff = me.hp - opp.hp;
    const hpScore = Math.abs(hpDiff) > 4 ? Math.sign(hpDiff) * Math.floor((Math.abs(hpDiff) - 4) / 4 + 1) : 0;
    const threatScore = boardThreat(me) - boardThreat(opp);
    let specialScore = 0;
    const details = [];
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
export function calculateAdvantage(me, opp) {
    return getAdvantageBreakdown(me, opp).total;
}
export function getSlotGain(value) {
    const abs = Math.abs(value);
    if (abs === 0)
        return 0;
    if (abs <= 3)
        return 1;
    if (abs <= 6)
        return 2;
    return 3;
}
export function groupDeckChoices(deck) {
    const counts = new Map();
    for (const card of deck) {
        counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
    return [...counts.entries()].map(([cardId, count]) => ({ cardId, count }));
}
export function removeFirstMatching(items, predicate) {
    const index = items.findIndex(predicate);
    if (index < 0)
        return null;
    return items.splice(index, 1)[0] ?? null;
}
export function createEmptyPlayerState(playerId, characterId) {
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
            slotGainModifier: { jump: 0, godDraw: 0 },
            openingBonusDraw: 0,
            openingBonusMana: 0,
            openingSlotBonus: { jump: 0, godDraw: 0 },
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
