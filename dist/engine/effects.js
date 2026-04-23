import { getCardDefinition } from "../data/cards.js";
import { createMinionInstance, createPersistentInstance, createRuntimeCard, removeFirstMatching } from "./rules.js";
const PLAYER_ID = "P1";
const AI_ID = "P2";
function getBaseCost(card) {
    return "baseCost" in card ? card.baseCost : card.cost;
}
function getSpellDamageBonus(game, playerId, context) {
    return context.sourceCard?.type === "spell" ? game.getPlayer(playerId).temporaryFlags.spellDamageBonus : 0;
}
function isMagicSource(context) {
    if (context.sourceCard?.type === "spell")
        return true;
    return Boolean(context.source && "type" in context.source);
}
function canBeTargetedByMagic(minion, actingPlayerId, context) {
    if (minion.ownerId === actingPlayerId)
        return true;
    if (!minion.tags.includes("magicRes"))
        return true;
    return !isMagicSource(context);
}
function getGuardMinions(game, playerId) {
    const player = game.getPlayer(playerId);
    const taggedGuards = player.board.filter((minion) => minion.tags.includes("guard"));
    if (taggedGuards.length)
        return taggedGuards;
    if (player.temporaryFlags.loneMinionGuard && player.board.length === 1) {
        return [...player.board];
    }
    return [];
}
function findPriorityEnemyMinion(game, playerId) {
    const opponent = game.getOpponent(playerId);
    return [...opponent.board].sort((left, right) => {
        if (right.threat !== left.threat)
            return right.threat - left.threat;
        if (right.health !== left.health)
            return right.health - left.health;
        return right.attack - left.attack;
    })[0] ?? null;
}
function millCards(game, sourcePlayerId, target, count) {
    const targetPlayer = target === "self" ? game.getPlayer(sourcePlayerId) : game.getOpponent(sourcePlayerId);
    const milled = targetPlayer.deck.splice(0, count);
    if (!milled.length)
        return;
    for (const card of milled) {
        targetPlayer.graveyard.push({ id: card.id, name: card.name, runtimeId: card.runtimeId });
    }
    game.log(`${game.getCharacter(targetPlayer.character).name} 被磨掉了 ${milled.length} 张牌。`);
}
function dealHeroDamage(game, targetPlayerId, amount) {
    if (amount <= 0)
        return;
    const player = game.getPlayer(targetPlayerId);
    const character = game.getCharacter(player.character);
    player.hp -= amount;
    player.temporaryFlags.damageTakenThisTurn += amount;
    if (character.passive.key === "gainGodDrawOnBigDamage" && amount > 3) {
        game.adjustSlot(targetPlayerId, "godDraw", 1, "角色被动");
    }
    if (player.temporaryFlags.millOnDamageTaken > 0) {
        millCards(game, targetPlayerId, "opponent", amount * player.temporaryFlags.millOnDamageTaken);
    }
}
function addCardToHand(game, playerId, cardId) {
    const player = game.getPlayer(playerId);
    const card = createRuntimeCard(getCardDefinition(cardId));
    if (player.hand.length >= player.handLimit) {
        player.graveyard.push({ id: card.id, name: card.name, runtimeId: card.runtimeId });
        game.log(`${game.getCharacter(player.character).name} burns ${card.name} because the hand is full.`);
        return;
    }
    player.hand.push(card);
    game.log(`${game.getCharacter(player.character).name} adds ${card.name} to hand.`);
}
function resolvePriorityExile(game, playerId, mode) {
    const opponent = game.getOpponent(playerId);
    const target = findPriorityEnemyMinion(game, playerId);
    if (!target)
        return;
    opponent.board = opponent.board.filter((minion) => minion.instanceId !== target.instanceId);
    opponent.graveyard.push({
        id: target.sourceCardId,
        name: target.name,
        runtimeId: target.instanceId
    });
    const damage = mode === "health" ? Math.max(0, target.health) : Math.max(0, target.attack + target.health);
    dealHeroDamage(game, game.getOpponentId(playerId), damage);
    game.log(`${target.name} 被除外，并结算了 ${damage} 点伤害。`, "alert");
}
export function resolveOnTurnStart(game, playerId) {
    const player = game.getPlayer(playerId);
    const boardEffects = player.board.flatMap((minion) => minion.effects
        .filter((effect) => effect.trigger === "onTurnStart")
        .map((effect) => ({ effect, source: minion })));
    const persistentEffects = player.persistents.flatMap((card) => card.effects
        .filter((effect) => effect.trigger === "onTurnStart")
        .map((effect) => ({ effect, source: card })));
    for (const { effect, source } of [...boardEffects, ...persistentEffects]) {
        game.resolveAction(playerId, effect.action, { source });
    }
}
export function drawCards(game, playerId, count, reason = "抽牌") {
    const player = game.getPlayer(playerId);
    for (let index = 0; index < count; index += 1) {
        if (!player.deck.length) {
            if (!player.hand.length) {
                game.state.winner = game.getOpponentId(playerId);
                game.state.phase = "gameOver";
                game.log(`${game.getCharacter(player.character).name} 牌库见底且无法再抽牌，败北。`, "alert");
            }
            return;
        }
        const drawn = player.deck.shift();
        if (!drawn)
            return;
        if (player.temporaryFlags.nextDrawDiscount > 0) {
            drawn.currentCost = Math.max(0, drawn.currentCost - player.temporaryFlags.nextDrawDiscount);
            player.temporaryFlags.nextDrawDiscount = 0;
        }
        if (player.hand.length >= player.handLimit) {
            player.graveyard.push({ id: drawn.id, name: drawn.name, runtimeId: drawn.runtimeId });
            game.log(`${game.getCharacter(player.character).name} 因手牌已满烧掉了 ${drawn.name}。`);
            continue;
        }
        player.hand.push(drawn);
        game.log(`${game.getCharacter(player.character).name} 因 ${reason} 抽到了 ${drawn.name}。`);
    }
}
export function playCard(game, runtimeId) {
    const player = game.getCurrentPlayer();
    if (player.id !== PLAYER_ID || game.state.phase !== "mainTurn")
        return false;
    const index = player.hand.findIndex((card) => card.runtimeId === runtimeId);
    if (index < 0)
        return false;
    return game.playCardAtIndex(player.id, index);
}
export function playCardAtIndex(game, playerId, index) {
    if (game.state.phase !== "mainTurn")
        return false;
    const player = game.getPlayer(playerId);
    const card = player.hand[index];
    if (!card)
        return false;
    if (player.mana < card.currentCost)
        return false;
    if (card.type === "minion" && player.board.length >= 7)
        return false;
    player.mana -= card.currentCost;
    player.hand.splice(index, 1);
    game.log(`${game.getCharacter(player.character).name} 打出了 ${card.name}。`);
    if (card.type === "minion") {
        game.summonMinion(playerId, card, { triggerOnPlay: true, canTriggerTrap: true });
    }
    else if (card.type === "spell") {
        game.resolveEffects(playerId, card.effects, { sourceCard: card });
        player.graveyard.push({ id: card.id, name: card.name, runtimeId: card.runtimeId });
        game.triggerTraps(game.getOpponentId(playerId), "enemyCastsSpell", { sourceCard: card });
    }
    else if (card.type === "persistent") {
        player.persistents.push(createPersistentInstance(card, playerId));
    }
    else if (card.type === "trap") {
        player.traps.push(createPersistentInstance(card, playerId));
    }
    game.checkForDeaths();
    game.checkGameOver();
    return true;
}
export function summonMinion(game, playerId, card, { triggerOnPlay = false, canTriggerTrap = false } = {}) {
    const player = game.getPlayer(playerId);
    if (player.board.length >= 7) {
        game.log(`${card.name} 因场地已满而无法召唤。`);
        return null;
    }
    const instance = createMinionInstance(card, playerId);
    const lowCostRushMaxCost = player.temporaryFlags.lowCostRushMaxCost;
    if (lowCostRushMaxCost !== null && getBaseCost(card) <= lowCostRushMaxCost && !instance.tags.includes("rush")) {
        instance.tags.push("rush");
        instance.canAttack = true;
    }
    player.board.push(instance);
    if (triggerOnPlay) {
        game.resolveEffects(playerId, card.effects.filter((effect) => effect.trigger === "onPlay"), {
            source: instance,
            sourceCard: "runtimeId" in card ? card : createRuntimeCard(card)
        });
    }
    if (canTriggerTrap) {
        game.triggerTraps(game.getOpponentId(playerId), "enemySummonsMinion", { triggeredMinion: instance });
    }
    return instance;
}
export function resolveEffects(game, playerId, effects, context) {
    for (const effect of effects) {
        game.resolveAction(playerId, effect.action, context);
    }
}
export function triggerTraps(game, ownerId, conditionType, context) {
    const owner = game.getPlayer(ownerId);
    const triggered = owner.traps.filter((trap) => trap.effects.some((effect) => effect.trigger === "onTriggerMet" && effect.condition?.type === conditionType));
    if (!triggered.length)
        return;
    for (const trap of triggered) {
        owner.traps = owner.traps.filter((item) => item.instanceId !== trap.instanceId);
        for (const effect of trap.effects) {
            if (effect.trigger === "onTriggerMet" && effect.condition?.type === conditionType) {
                game.log(`${game.getCharacter(owner.character).name} 触发了陷阱 ${trap.name}。`, "alert");
                game.resolveAction(ownerId, effect.action, { ...context, source: trap });
            }
        }
        owner.graveyard.push({ id: trap.sourceCardId, name: trap.name, runtimeId: trap.instanceId });
    }
}
export function resolveAction(game, playerId, action, context = {}) {
    const player = game.getPlayer(playerId);
    const opponent = game.getOpponent(playerId);
    switch (action.type) {
        case "damage":
            resolveDamageAction(game, playerId, action, context);
            break;
        case "heal":
            if (action.target === "selfHero") {
                player.hp = Math.min(player.maxHp, player.hp + action.amount);
            }
            else if (action.target === "enemyHero") {
                opponent.hp = Math.min(opponent.maxHp, opponent.hp + action.amount);
            }
            break;
        case "draw":
            game.drawCards(playerId, action.count, "效果");
            break;
        case "addCardToHand":
            for (let index = 0; index < (action.count ?? 1); index += 1) {
                addCardToHand(game, playerId, action.cardId);
            }
            break;
        case "summon":
            for (let index = 0; index < (action.count ?? 1); index += 1) {
                game.summonMinion(playerId, createRuntimeCard(getCardDefinition(action.cardId)), {
                    triggerOnPlay: false,
                    canTriggerTrap: true
                });
            }
            break;
        case "buff":
            resolveBuffAction(game, playerId, action, context);
            break;
        case "destroy":
            resolveDestroyAction(game, playerId, action.target, context);
            break;
        case "addSlot":
            game.adjustSlot(playerId, action.slot, action.amount, "效果");
            break;
        case "discard":
            resolveDiscardAction(game, playerId, action.target, action.count);
            break;
        case "setTopDeck":
            resolveSetTopDeck(game, playerId, action.cardId);
            break;
        case "discountNextDraw":
            player.temporaryFlags.nextDrawDiscount = Math.max(player.temporaryFlags.nextDrawDiscount, action.amount);
            break;
        case "gainMana":
            player.mana = Math.min(10, player.mana + action.amount);
            break;
        case "setIgnoreGuard":
            player.temporaryFlags.ignoreGuardThisTurn = action.enabled ?? true;
            break;
        case "applyOpponentNextTurnManaPenalty":
            opponent.temporaryFlags.nextTurnManaPenalty = Math.max(opponent.temporaryFlags.nextTurnManaPenalty, action.amount);
            break;
        case "millDeck":
            millCards(game, playerId, action.target, action.count);
            break;
        case "setMillOnDamageTaken":
            player.temporaryFlags.millOnDamageTaken = Math.max(player.temporaryFlags.millOnDamageTaken, action.amount);
            break;
        case "exilePriorityEnemyMinionAndDamageHero":
            resolvePriorityExile(game, playerId, action.damageHeroBy);
            break;
        case "grantAdjacentGuard":
            if (context.source && !("type" in context.source)) {
                resolveGrantAdjacentGuard(game, playerId, context.source.instanceId);
            }
            break;
        case "buffSelfIfHeroHpBelow":
            if (player.hp < action.threshold && context.source && !("type" in context.source)) {
                if (action.atk)
                    context.source.attack += action.atk;
                if (action.hp) {
                    context.source.health += action.hp;
                    context.source.maxHealth += action.hp;
                }
            }
            break;
        default:
            break;
    }
    game.checkGameOver();
}
function resolveDamageAction(game, playerId, action, context) {
    const opponent = game.getOpponent(playerId);
    const player = game.getPlayer(playerId);
    const bonus = getSpellDamageBonus(game, playerId, context);
    const amount = action.amount + bonus;
    const availableEnemyMinions = opponent.board.filter((minion) => canBeTargetedByMagic(minion, playerId, context));
    if (action.target === "enemyHero") {
        dealHeroDamage(game, opponent.id, amount);
        return;
    }
    if (action.target === "selfHero") {
        dealHeroDamage(game, player.id, amount);
        return;
    }
    const affected = [];
    if (action.target === "allEnemyMinions") {
        affected.push(...availableEnemyMinions);
    }
    else if (action.target === "allFriendlyMinions") {
        affected.push(...player.board);
    }
    else if (action.target === "strongestEnemyMinion") {
        const strongest = [...availableEnemyMinions].sort((left, right) => right.attack - left.attack)[0];
        if (strongest)
            affected.push(strongest);
    }
    else if (action.target === "weakestEnemyMinion") {
        const weakest = [...availableEnemyMinions].sort((left, right) => left.attack - right.attack)[0];
        if (weakest)
            affected.push(weakest);
    }
    else if (action.target === "triggeredMinion" && context.triggeredMinion) {
        if (context.triggeredMinion.ownerId === playerId ||
            canBeTargetedByMagic(context.triggeredMinion, playerId, context)) {
            affected.push(context.triggeredMinion);
        }
    }
    for (const unit of affected) {
        unit.health -= amount;
    }
}
function resolveBuffAction(game, playerId, action, context) {
    const player = game.getPlayer(playerId);
    let targets = [];
    if (action.target === "allFriendlyMinions") {
        targets = player.board;
    }
    else if (action.target === "allFriendlyMinionsExceptSource") {
        const sourceId = context.source?.instanceId;
        targets = player.board.filter((minion) => minion.instanceId !== sourceId);
    }
    else if (action.target === "triggeredMinion" && context.triggeredMinion) {
        targets = [context.triggeredMinion];
    }
    for (const target of targets) {
        if (action.atk)
            target.attack += action.atk;
        if (action.hp) {
            target.health += action.hp;
            target.maxHealth += action.hp;
        }
    }
}
function resolveDestroyAction(game, playerId, targetType, context) {
    const opponent = game.getOpponent(playerId);
    const availableEnemyMinions = opponent.board.filter((minion) => canBeTargetedByMagic(minion, playerId, context));
    let target = null;
    if (targetType === "strongestEnemyMinion") {
        target = [...availableEnemyMinions].sort((left, right) => right.attack - left.attack)[0] ?? null;
    }
    else if (targetType === "weakestEnemyMinion") {
        target = [...availableEnemyMinions].sort((left, right) => left.attack - right.attack)[0] ?? null;
    }
    if (target) {
        target.health = 0;
    }
}
function resolveGrantAdjacentGuard(game, playerId, sourceId) {
    const player = game.getPlayer(playerId);
    const sourceIndex = player.board.findIndex((minion) => minion.instanceId === sourceId);
    if (sourceIndex < 0)
        return;
    for (const index of [sourceIndex - 1, sourceIndex + 1]) {
        const target = player.board[index];
        if (!target || target.tags.includes("guard"))
            continue;
        target.tags.push("guard");
    }
}
function resolveDiscardAction(game, playerId, discardTarget, count) {
    const targetPlayer = discardTarget === "self" ? game.getPlayer(playerId) : game.getOpponent(playerId);
    for (let index = 0; index < count; index += 1) {
        if (!targetPlayer.hand.length)
            break;
        const removed = targetPlayer.hand.pop();
        if (removed) {
            targetPlayer.graveyard.push({ id: removed.id, name: removed.name, runtimeId: removed.runtimeId });
        }
    }
}
function resolveSetTopDeck(game, playerId, cardId) {
    const player = game.getPlayer(playerId);
    const card = removeFirstMatching(player.deck, (item) => item.id === cardId);
    if (card)
        player.deck.unshift(card);
}
export function attack(game, attackerId, targetId, targetType) {
    const player = game.getCurrentPlayer();
    if (player.id !== PLAYER_ID || (game.state.phase !== "mainTurn" && game.state.phase !== "combat"))
        return false;
    return game.attackWith(player.id, attackerId, targetId, targetType);
}
export function attackWith(game, playerId, attackerId, targetId, targetType) {
    const player = game.getPlayer(playerId);
    const attacker = player.board.find((minion) => minion.instanceId === attackerId);
    if (!attacker || !attacker.canAttack)
        return false;
    const opponentId = game.getOpponentId(playerId);
    const opponent = game.getPlayer(opponentId);
    const guardMinions = player.temporaryFlags.ignoreGuardThisTurn ? [] : getGuardMinions(game, opponentId);
    if (guardMinions.length && targetType === "hero")
        return false;
    if (guardMinions.length && targetType === "minion" && !guardMinions.some((minion) => minion.instanceId === targetId)) {
        return false;
    }
    attacker.canAttack = false;
    if (game.state.phase === "mainTurn") {
        game.state.phase = "combat";
    }
    if (targetType === "hero") {
        dealHeroDamage(game, opponent.id, attacker.attack);
        game.log(`${attacker.name} 对敌方英雄造成了 ${attacker.attack} 点伤害。`, "alert");
    }
    else {
        const defender = opponent.board.find((minion) => minion.instanceId === targetId);
        if (!defender)
            return false;
        defender.health -= attacker.attack;
        attacker.health -= defender.attack;
        const attackedEffects = defender.effects.filter((effect) => effect.trigger === "onAttacked");
        for (const effect of attackedEffects) {
            game.resolveAction(opponentId, effect.action, { source: defender });
        }
        game.log(`${attacker.name} 与 ${defender.name} 发生了战斗。`);
    }
    game.checkForDeaths();
    game.checkGameOver();
    return true;
}
export function getAttackTargets(game, attackerId, playerId) {
    const player = game.getPlayer(playerId);
    const attacker = player.board.find((minion) => minion.instanceId === attackerId);
    if (!attacker || !attacker.canAttack)
        return [];
    const opponentId = game.getOpponentId(playerId);
    const opponent = game.getPlayer(opponentId);
    const guardMinions = player.temporaryFlags.ignoreGuardThisTurn ? [] : getGuardMinions(game, opponentId);
    if (guardMinions.length) {
        return guardMinions.map((minion) => ({ type: "minion", id: minion.instanceId, label: minion.name }));
    }
    return [
        { type: "hero", id: `${opponentId}_hero`, label: "敌方英雄" },
        ...opponent.board.map((minion) => ({ type: "minion", id: minion.instanceId, label: minion.name }))
    ];
}
export function getPlayableCards(game, playerId) {
    const player = game.getPlayer(playerId);
    return player.hand.filter((card) => card.currentCost <= player.mana);
}
export function getReadyAttackers(game, playerId) {
    return game.getPlayer(playerId).board.filter((minion) => minion.canAttack);
}
export function getAIAttackTargets(game, attackerId, playerId) {
    return game.getAttackTargets(attackerId, playerId);
}
export function checkForDeaths(game) {
    let anyDeath = true;
    while (anyDeath) {
        anyDeath = false;
        for (const playerId of [PLAYER_ID, AI_ID]) {
            const player = game.getPlayer(playerId);
            const dead = player.board.filter((minion) => minion.health <= 0);
            if (!dead.length)
                continue;
            anyDeath = true;
            for (const minion of dead) {
                player.board = player.board.filter((item) => item.instanceId !== minion.instanceId);
                player.graveyard.push({
                    id: minion.sourceCardId,
                    name: minion.name,
                    runtimeId: minion.instanceId
                });
                game.log(`${minion.name} 被击破并进入墓地。`);
                const deathEffects = minion.effects.filter((effect) => effect.trigger === "onDeath");
                for (const effect of deathEffects) {
                    game.resolveAction(playerId, effect.action, { source: minion });
                }
            }
        }
    }
}
export function checkGameOver(game) {
    const player = game.state.players[PLAYER_ID];
    const ai = game.state.players[AI_ID];
    if (player.hp <= 0 && ai.hp <= 0) {
        game.state.winner = AI_ID;
        game.state.phase = "gameOver";
        game.log("双方角色同时倒下，判定 AI 获胜。", "alert");
        return true;
    }
    if (player.hp <= 0) {
        game.state.winner = AI_ID;
        game.state.phase = "gameOver";
        game.log("你的生命值归零，战斗失败。", "alert");
        return true;
    }
    if (ai.hp <= 0) {
        game.state.winner = PLAYER_ID;
        game.state.phase = "gameOver";
        game.log("敌方生命值归零，你获得了胜利。", "alert");
        return true;
    }
    return false;
}
