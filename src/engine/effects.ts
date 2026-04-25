import { getCardDefinition } from "../data/cards.js";
import type { CardDefinition, Effect, EffectAction, EffectContext, MinionInstance, PlayerId, RuntimeCard } from "../types.js";
import { createMinionInstance, createPersistentInstance, createRuntimeCard, removeFirstMatching } from "./rules.js";
import type { ShinDoroGame } from "./gameState.js";

const PLAYER_ID: PlayerId = "P1";
const AI_ID: PlayerId = "P2";

function getBaseCost(card: CardDefinition | RuntimeCard): number {
  return "baseCost" in card ? card.baseCost : card.cost;
}

function getSpellDamageBonus(game: ShinDoroGame, playerId: PlayerId, context: EffectContext): number {
  return context.sourceCard?.type === "spell" ? game.getPlayer(playerId).temporaryFlags.spellDamageBonus : 0;
}

function isMagicSource(context: EffectContext): boolean {
  if (context.sourceCard?.type === "spell") return true;
  return Boolean(context.source && "type" in context.source);
}

function canBeTargetedByMagic(minion: MinionInstance, actingPlayerId: PlayerId, context: EffectContext): boolean {
  if (minion.ownerId === actingPlayerId) return true;
  if (minion.tags.includes("stealth")) return false;
  if (!minion.tags.includes("magicRes")) return true;
  return !isMagicSource(context);
}

function canBeTargetedByCombat(minion: MinionInstance, actingPlayerId: PlayerId): boolean {
  if (minion.ownerId === actingPlayerId) return true;
  return !minion.tags.includes("stealth");
}

function getGuardMinions(game: ShinDoroGame, playerId: PlayerId) {
  const player = game.getPlayer(playerId);
  const taggedGuards = player.board.filter((minion) => minion.tags.includes("guard"));
  if (taggedGuards.length) return taggedGuards;
  if (player.temporaryFlags.loneMinionGuard && player.board.length === 1) {
    return [...player.board];
  }
  return [];
}

function findPriorityEnemyMinion(game: ShinDoroGame, playerId: PlayerId) {
  const opponent = game.getOpponent(playerId);
  return [...opponent.board].sort((left, right) => {
    if (right.threat !== left.threat) return right.threat - left.threat;
    if (right.health !== left.health) return right.health - left.health;
    return right.attack - left.attack;
  })[0] ?? null;
}

function millCards(game: ShinDoroGame, sourcePlayerId: PlayerId, target: "self" | "opponent", count: number): void {
  const targetPlayer = target === "self" ? game.getPlayer(sourcePlayerId) : game.getOpponent(sourcePlayerId);
  const milled = targetPlayer.deck.splice(0, count);
  if (!milled.length) return;

  for (const card of milled) {
    targetPlayer.graveyard.push({ id: card.id, name: card.name, runtimeId: card.runtimeId });
  }

  game.log(`${game.getCharacter(targetPlayer.character).name} 被磨掉了 ${milled.length} 张牌。`);
}

function dealHeroDamage(game: ShinDoroGame, targetPlayerId: PlayerId, amount: number): void {
  if (amount <= 0) return;

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

function healHero(game: ShinDoroGame, targetPlayerId: PlayerId, amount: number): number {
  if (amount <= 0) return 0;
  const player = game.getPlayer(targetPlayerId);
  const total = amount + player.temporaryFlags.healingReceivedBonus;
  const before = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + total);
  return player.hp - before;
}

function discardCardsFromHand(
  game: ShinDoroGame,
  targetPlayerId: PlayerId,
  count: number,
  mode: "last" | "random" | "highestCost" = "last"
): number {
  const targetPlayer = game.getPlayer(targetPlayerId);
  let discarded = 0;

  for (let index = 0; index < count; index += 1) {
    if (!targetPlayer.hand.length) break;

    let cardIndex = targetPlayer.hand.length - 1;
    if (mode === "random") {
      cardIndex = Math.floor(game.rng() * targetPlayer.hand.length);
    } else if (mode === "highestCost") {
      cardIndex = targetPlayer.hand
        .map((card, handIndex) => ({ card, handIndex }))
        .sort((left, right) => {
          if (right.card.currentCost !== left.card.currentCost) {
            return right.card.currentCost - left.card.currentCost;
          }
          return right.card.baseCost - left.card.baseCost;
        })[0]?.handIndex ?? targetPlayer.hand.length - 1;
    }

    const [removed] = targetPlayer.hand.splice(cardIndex, 1);
    if (!removed) continue;
    targetPlayer.graveyard.push({ id: removed.id, name: removed.name, runtimeId: removed.runtimeId });
    discarded += 1;
  }

  if (discarded > 0) {
    game.log(`${game.getCharacter(targetPlayer.character).name} 弃置了 ${discarded} 张手牌。`);
  }
  return discarded;
}

function triggerOverflowConsequences(game: ShinDoroGame, playerId: PlayerId): void {
  const player = game.getPlayer(playerId);
  const opponentId = game.getOpponentId(playerId);

  if (player.temporaryFlags.overflowOpponentDiscardCount > 0) {
    discardCardsFromHand(game, opponentId, player.temporaryFlags.overflowOpponentDiscardCount, "random");
  }

  if (player.temporaryFlags.overflowOpponentMillCount > 0) {
    millCards(game, playerId, "opponent", player.temporaryFlags.overflowOpponentMillCount);
  }
}

function addCardToHand(game: ShinDoroGame, playerId: PlayerId, cardId: string): void {
  const player = game.getPlayer(playerId);
  const card = createRuntimeCard(getCardDefinition(cardId));

  if (player.hand.length >= player.handLimit) {
    player.graveyard.push({ id: card.id, name: card.name, runtimeId: card.runtimeId });
    game.log(`${game.getCharacter(player.character).name} 因手牌已满烧掉了 ${card.name}。`);
    triggerOverflowConsequences(game, playerId);
    return;
  }

  player.hand.push(card);
  game.log(`${game.getCharacter(player.character).name} 将 ${card.name} 加入手牌。`);
}

function resolvePriorityExile(game: ShinDoroGame, playerId: PlayerId, mode: "health" | "attackAndHealth"): void {
  const opponent = game.getOpponent(playerId);
  const target = findPriorityEnemyMinion(game, playerId);
  if (!target) return;

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

export function resolveOnTurnStart(game: ShinDoroGame, playerId: PlayerId): void {
  const player = game.getPlayer(playerId);
  const boardEffects = player.board.flatMap((minion) =>
    minion.effects
      .filter((effect) => effect.trigger === "onTurnStart")
      .map((effect) => ({ effect, source: minion }))
  );
  const persistentEffects = player.persistents.flatMap((card) =>
    card.effects
      .filter((effect) => effect.trigger === "onTurnStart")
      .map((effect) => ({ effect, source: card }))
  );

  for (const { effect, source } of [...boardEffects, ...persistentEffects]) {
    game.resolveAction(playerId, effect.action, { source });
  }
}

export function drawCards(game: ShinDoroGame, playerId: PlayerId, count: number, reason = "抽牌"): void {
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
    if (!drawn) return;

    if (player.temporaryFlags.nextDrawDiscount > 0) {
      drawn.currentCost = Math.max(0, drawn.currentCost - player.temporaryFlags.nextDrawDiscount);
      player.temporaryFlags.nextDrawDiscount = 0;
    }

    if (player.hand.length >= player.handLimit) {
      player.graveyard.push({ id: drawn.id, name: drawn.name, runtimeId: drawn.runtimeId });
      game.log(`${game.getCharacter(player.character).name} 因手牌已满烧掉了 ${drawn.name}。`);
      triggerOverflowConsequences(game, playerId);
      continue;
    }

    player.hand.push(drawn);
    game.log(`${game.getCharacter(player.character).name} 因 ${reason} 抽到了 ${drawn.name}。`);
  }
}

export function playCard(game: ShinDoroGame, runtimeId: string): boolean {
  const player = game.getCurrentPlayer();
  if (player.id !== PLAYER_ID || game.state.phase !== "mainTurn") return false;
  const index = player.hand.findIndex((card) => card.runtimeId === runtimeId);
  if (index < 0) return false;
  return game.playCardAtIndex(player.id, index);
}

export function playCardAtIndex(game: ShinDoroGame, playerId: PlayerId, index: number): boolean {
  if (game.state.winner || game.state.currentPlayer !== playerId || game.state.phase !== "mainTurn") return false;
  const player = game.getPlayer(playerId);
  const card = player.hand[index];
  if (!card) return false;
  if (player.mana < card.currentCost) return false;
  if (card.type === "minion" && player.board.length >= 7) return false;

  player.mana -= card.currentCost;
  player.hand.splice(index, 1);
  game.log(`${game.getCharacter(player.character).name} 打出了 ${card.name}。`);

  if (card.type === "minion") {
    game.summonMinion(playerId, card, { triggerOnPlay: true, canTriggerTrap: true });
  } else if (card.type === "spell") {
    game.resolveEffects(playerId, card.effects, { sourceCard: card });
    player.graveyard.push({ id: card.id, name: card.name, runtimeId: card.runtimeId });
    game.triggerTraps(game.getOpponentId(playerId), "enemyCastsSpell", { sourceCard: card });
  } else if (card.type === "persistent") {
    player.persistents.push(createPersistentInstance(card, playerId));
  } else if (card.type === "trap") {
    player.traps.push(createPersistentInstance(card, playerId));
  }

  game.checkForDeaths();
  game.checkGameOver();
  return true;
}

export function summonMinion(
  game: ShinDoroGame,
  playerId: PlayerId,
  card: CardDefinition | RuntimeCard,
  { triggerOnPlay = false, canTriggerTrap = false }: { triggerOnPlay?: boolean; canTriggerTrap?: boolean } = {}
) {
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
    game.resolveEffects(
      playerId,
      card.effects.filter((effect) => effect.trigger === "onPlay"),
      {
        source: instance,
        sourceCard: "runtimeId" in card ? card : createRuntimeCard(card)
      }
    );
  }

  if (canTriggerTrap) {
    game.triggerTraps(game.getOpponentId(playerId), "enemySummonsMinion", { triggeredMinion: instance });
  }

  return instance;
}

export function resolveEffects(game: ShinDoroGame, playerId: PlayerId, effects: Effect[], context: EffectContext): void {
  for (const effect of effects) {
    game.resolveAction(playerId, effect.action, context);
  }
}

export function triggerTraps(
  game: ShinDoroGame,
  ownerId: PlayerId,
  conditionType: "enemyCastsSpell" | "enemySummonsMinion",
  context: EffectContext
): void {
  const owner = game.getPlayer(ownerId);
  const triggered = owner.traps.filter((trap) =>
    trap.effects.some((effect) => effect.trigger === "onTriggerMet" && effect.condition?.type === conditionType)
  );

  if (!triggered.length) return;

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

export function resolveAction(
  game: ShinDoroGame,
  playerId: PlayerId,
  action: EffectAction,
  context: EffectContext = {}
): void {
  const player = game.getPlayer(playerId);
  const opponent = game.getOpponent(playerId);

  switch (action.type) {
    case "damage":
      resolveDamageAction(game, playerId, action, context);
      break;
    case "heal":
      if (action.target === "selfHero") {
        healHero(game, player.id, action.amount);
      } else if (action.target === "enemyHero") {
        healHero(game, opponent.id, action.amount);
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
    case "discardWithEmptyHandDamage":
      resolveDiscardWithEmptyHandDamage(game, playerId, action);
      break;
    case "setTopDeck":
      resolveSetTopDeck(game, playerId, action.cardId);
      break;
    case "discountNextDraw":
      player.temporaryFlags.nextDrawDiscount = Math.max(player.temporaryFlags.nextDrawDiscount, action.amount);
      break;
    case "gainMana":
      player.mana = Math.min(player.temporaryFlags.maxManaCap, player.mana + action.amount);
      break;
    case "setIgnoreGuard":
      player.temporaryFlags.ignoreGuardThisTurn = action.enabled ?? true;
      break;
    case "applyOpponentNextTurnManaPenalty":
      opponent.temporaryFlags.nextTurnManaPenalty = Math.max(
        opponent.temporaryFlags.nextTurnManaPenalty,
        action.amount
      );
      break;
    case "applyOpponentNextTurnManaMultiplier":
      opponent.temporaryFlags.nextTurnManaMultiplier = Math.min(
        opponent.temporaryFlags.nextTurnManaMultiplier,
        action.multiplier
      );
      break;
    case "millDeck":
      millCards(game, playerId, action.target, action.count);
      break;
    case "millDeckUntilRemaining":
      resolveMillDeckUntilRemaining(game, playerId, action.target, action.remaining, action.onlyIfAbove);
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
        if (action.atk) context.source.attack += action.atk;
        if (action.hp) {
          context.source.health += action.hp;
          context.source.maxHealth += action.hp;
        }
      }
      break;
    case "grantExtraTurn":
      player.temporaryFlags.extraTurnPending = true;
      if (action.loseIfNoWin) {
        player.temporaryFlags.loseAtEndOfExtraTurn = true;
      }
      game.log(`${game.getCharacter(player.character).name} 获得了一个额外回合。`, "alert");
      break;
    case "purgeAllMagicAndOtherMinions":
      resolvePurgeAllMagicAndOtherMinions(game, playerId, context, action.healPerRemoved ?? 0);
      break;
    case "swapHeroHp":
      [player.hp, opponent.hp] = [
        Math.min(player.maxHp, opponent.hp),
        Math.min(opponent.maxHp, player.hp)
      ];
      game.log("双方角色的当前生命值发生了互换。", "alert");
      break;
    case "destroyAllMinions":
      resolveDestroyAllMinions(game);
      break;
    case "destroyAllEnemyMinions":
      resolveDestroyPlayerMinions(opponent);
      break;
    case "destroyPersistents":
      resolveDestroyPersistents(game, playerId, action.target);
      break;
    case "destroyEnemyTraps":
      resolveDestroyEnemyTraps(game, playerId);
      break;
    default:
      break;
  }

  game.checkGameOver();
}

function resolveDamageAction(
  game: ShinDoroGame,
  playerId: PlayerId,
  action: Extract<EffectAction, { type: "damage" }>,
  context: EffectContext
): void {
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
    affected.push(...opponent.board);
  } else if (action.target === "allFriendlyMinions") {
    affected.push(...player.board);
  } else if (action.target === "strongestEnemyMinion") {
    const strongest = [...availableEnemyMinions].sort((left, right) => right.attack - left.attack)[0];
    if (strongest) affected.push(strongest);
  } else if (action.target === "weakestEnemyMinion") {
    const weakest = [...availableEnemyMinions].sort((left, right) => left.attack - right.attack)[0];
    if (weakest) affected.push(weakest);
  } else if (action.target === "triggeredMinion" && context.triggeredMinion) {
    if (
      context.triggeredMinion.ownerId === playerId ||
      canBeTargetedByMagic(context.triggeredMinion, playerId, context)
    ) {
      affected.push(context.triggeredMinion);
    }
  }

  for (const unit of affected) {
    unit.health -= amount;
  }
}

function resolveMillDeckUntilRemaining(
  game: ShinDoroGame,
  sourcePlayerId: PlayerId,
  target: "self" | "opponent",
  remaining: number,
  onlyIfAbove?: number
): void {
  const targetPlayer = target === "self" ? game.getPlayer(sourcePlayerId) : game.getOpponent(sourcePlayerId);
  if (onlyIfAbove !== undefined && targetPlayer.deck.length <= onlyIfAbove) return;
  const count = Math.max(0, targetPlayer.deck.length - remaining);
  millCards(game, sourcePlayerId, target, count);
}

function resolveDestroyPlayerMinions(player: ReturnType<ShinDoroGame["getPlayer"]>, exceptInstanceId?: string): number {
  let count = 0;
  for (const minion of player.board) {
    if (minion.instanceId === exceptInstanceId) continue;
    if (minion.health > 0) {
      minion.health = 0;
      count += 1;
    }
  }
  return count;
}

function resolveDestroyAllMinions(game: ShinDoroGame): number {
  return resolveDestroyPlayerMinions(game.getPlayer("P1")) + resolveDestroyPlayerMinions(game.getPlayer("P2"));
}

function resolvePurgeAllMagicAndOtherMinions(
  game: ShinDoroGame,
  playerId: PlayerId,
  context: EffectContext,
  healPerRemoved: number
): void {
  const sourceId = context.source && !("type" in context.source) ? context.source.instanceId : undefined;
  let removed = 0;

  for (const targetPlayerId of [PLAYER_ID, AI_ID]) {
    const targetPlayer = game.getPlayer(targetPlayerId);
    removed += targetPlayer.persistents.length + targetPlayer.traps.length;
    targetPlayer.persistents = [];
    targetPlayer.traps = [];
    removed += resolveDestroyPlayerMinions(targetPlayer, sourceId);
  }

  if (healPerRemoved > 0 && removed > 0) {
    healHero(game, playerId, removed * healPerRemoved);
  }

  game.log(`肃清效果移除了 ${removed} 张场上卡牌。`, "alert");
}

function resolveDestroyPersistents(game: ShinDoroGame, playerId: PlayerId, target: "all" | "enemy"): void {
  const targetPlayers = target === "all" ? [game.getPlayer("P1"), game.getPlayer("P2")] : [game.getOpponent(playerId)];
  let destroyed = 0;
  for (const targetPlayer of targetPlayers) {
    for (const card of targetPlayer.persistents) {
      targetPlayer.graveyard.push({ id: card.sourceCardId, name: card.name, runtimeId: card.instanceId });
      destroyed += 1;
    }
    targetPlayer.persistents = [];
  }
  game.log(`破坏了 ${destroyed} 张持续魔法。`);
}

function resolveDestroyEnemyTraps(game: ShinDoroGame, playerId: PlayerId): void {
  const opponent = game.getOpponent(playerId);
  const destroyed = opponent.traps.length;
  for (const card of opponent.traps) {
    opponent.graveyard.push({ id: card.sourceCardId, name: card.name, runtimeId: card.instanceId });
  }
  opponent.traps = [];
  game.log(`破坏了 ${destroyed} 张敌方触发魔法。`);
}

function resolveBuffAction(
  game: ShinDoroGame,
  playerId: PlayerId,
  action: Extract<EffectAction, { type: "buff" }>,
  context: EffectContext
): void {
  const player = game.getPlayer(playerId);
  let targets = [];
  if (action.target === "allFriendlyMinions") {
    targets = player.board;
  } else if (action.target === "allFriendlyMinionsExceptSource") {
    const sourceId = context.source?.instanceId;
    targets = player.board.filter((minion) => minion.instanceId !== sourceId);
  } else if (action.target === "triggeredMinion" && context.triggeredMinion) {
    targets = [context.triggeredMinion];
  }

  for (const target of targets) {
    if (action.atk) target.attack += action.atk;
    if (action.hp) {
      target.health += action.hp;
      target.maxHealth += action.hp;
    }
  }
}

function resolveDestroyAction(
  game: ShinDoroGame,
  playerId: PlayerId,
  targetType: "strongestEnemyMinion" | "weakestEnemyMinion",
  context: EffectContext
): void {
  const opponent = game.getOpponent(playerId);
  const availableEnemyMinions = opponent.board.filter((minion) => canBeTargetedByMagic(minion, playerId, context));
  let target = null;
  if (targetType === "strongestEnemyMinion") {
    target = [...availableEnemyMinions].sort((left, right) => right.attack - left.attack)[0] ?? null;
  } else if (targetType === "weakestEnemyMinion") {
    target = [...availableEnemyMinions].sort((left, right) => left.attack - right.attack)[0] ?? null;
  }
  if (target) {
    target.health = 0;
  }
}

function resolveGrantAdjacentGuard(game: ShinDoroGame, playerId: PlayerId, sourceId: string): void {
  const player = game.getPlayer(playerId);
  const sourceIndex = player.board.findIndex((minion) => minion.instanceId === sourceId);
  if (sourceIndex < 0) return;

  for (const index of [sourceIndex - 1, sourceIndex + 1]) {
    const target = player.board[index];
    if (!target || target.tags.includes("guard")) continue;
    target.tags.push("guard");
  }
}

function resolveDiscardAction(
  game: ShinDoroGame,
  playerId: PlayerId,
  discardTarget: "self" | "opponent",
  count: number
): void {
  const targetPlayerId = discardTarget === "self" ? playerId : game.getOpponentId(playerId);
  discardCardsFromHand(game, targetPlayerId, count);
}

function resolveDiscardWithEmptyHandDamage(
  game: ShinDoroGame,
  playerId: PlayerId,
  action: Extract<EffectAction, { type: "discardWithEmptyHandDamage" }>
): void {
  const targetPlayerId = game.getOpponentId(playerId);
  const targetPlayer = game.getPlayer(targetPlayerId);

  if (targetPlayer.hand.length === 0) {
    dealHeroDamage(game, targetPlayerId, action.damageIfZero);
    game.log(`${game.getCharacter(targetPlayer.character).name} 没有手牌，额外失去 ${action.damageIfZero} 点生命。`, "alert");
    return;
  }

  if (targetPlayer.hand.length === 1) {
    discardCardsFromHand(game, targetPlayerId, 1, action.mode ?? "random");
    dealHeroDamage(game, targetPlayerId, action.damageIfOne);
    game.log(`${game.getCharacter(targetPlayer.character).name} 仅有 1 张手牌，额外失去 ${action.damageIfOne} 点生命。`, "alert");
    return;
  }

  discardCardsFromHand(game, targetPlayerId, action.count, action.mode ?? "random");
}

function resolveSetTopDeck(game: ShinDoroGame, playerId: PlayerId, cardId: string): void {
  const player = game.getPlayer(playerId);
  const card = removeFirstMatching(player.deck, (item) => item.id === cardId);
  if (card) player.deck.unshift(card);
}

export function attack(game: ShinDoroGame, attackerId: string, targetId: string, targetType: "hero" | "minion"): boolean {
  const player = game.getCurrentPlayer();
  if (player.id !== PLAYER_ID || (game.state.phase !== "mainTurn" && game.state.phase !== "combat")) return false;
  return game.attackWith(player.id, attackerId, targetId, targetType);
}

export function attackWith(
  game: ShinDoroGame,
  playerId: PlayerId,
  attackerId: string,
  targetId: string,
  targetType: "hero" | "minion"
): boolean {
  if (
    game.state.winner ||
    game.state.currentPlayer !== playerId ||
    (game.state.phase !== "mainTurn" && game.state.phase !== "combat")
  ) {
    return false;
  }

  const player = game.getPlayer(playerId);
  const attacker = player.board.find((minion) => minion.instanceId === attackerId);
  const maxAttacks = attacker?.tags.includes("doubleStrike") ? 2 : 1;
  if (!attacker || !attacker.canAttack || attacker.attacksThisTurn >= maxAttacks) return false;

  const opponentId = game.getOpponentId(playerId);
  const opponent = game.getPlayer(opponentId);
  const guardMinions = player.temporaryFlags.ignoreGuardThisTurn ? [] : getGuardMinions(game, opponentId);
  if (guardMinions.length && targetType === "hero") return false;
  if (guardMinions.length && targetType === "minion" && !guardMinions.some((minion) => minion.instanceId === targetId)) {
    return false;
  }

  if (targetType === "hero") {
    if (targetId !== `${opponentId}_hero`) return false;
    attacker.attacksThisTurn += 1;
    attacker.canAttack = attacker.attacksThisTurn < maxAttacks;
    if (game.state.phase === "mainTurn") {
      game.state.phase = "combat";
    }
    dealHeroDamage(game, opponent.id, attacker.attack);
    if (attacker.tags.includes("lifesteal")) {
      healHero(game, player.id, Math.max(0, attacker.attack));
    }
    attacker.tags = attacker.tags.filter((tag) => tag !== "stealth");
    game.log(`${attacker.name} 对敌方英雄造成了 ${attacker.attack} 点伤害。`, "alert");
  } else {
    const defender = opponent.board.find((minion) => minion.instanceId === targetId);
    if (!defender) return false;
    if (!canBeTargetedByCombat(defender, playerId)) return false;
    attacker.attacksThisTurn += 1;
    attacker.canAttack = attacker.attacksThisTurn < maxAttacks;
    if (game.state.phase === "mainTurn") {
      game.state.phase = "combat";
    }
    defender.health -= attacker.attack;
    attacker.health -= defender.attack;
    if (attacker.tags.includes("deadly") && attacker.attack > 0) {
      defender.health = 0;
    }
    if (defender.tags.includes("deadly") && defender.attack > 0) {
      attacker.health = 0;
    }
    if (attacker.tags.includes("lifesteal")) {
      healHero(game, player.id, Math.max(0, attacker.attack));
    }
    if (defender.tags.includes("lifesteal")) {
      healHero(game, opponent.id, Math.max(0, defender.attack));
    }
    attacker.tags = attacker.tags.filter((tag) => tag !== "stealth");
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

export function getAttackTargets(game: ShinDoroGame, attackerId: string, playerId: PlayerId) {
  if (
    game.state.winner ||
    game.state.currentPlayer !== playerId ||
    (game.state.phase !== "mainTurn" && game.state.phase !== "combat")
  ) {
    return [];
  }

  const player = game.getPlayer(playerId);
  const attacker = player.board.find((minion) => minion.instanceId === attackerId);
  if (!attacker || !attacker.canAttack) return [];

  const opponentId = game.getOpponentId(playerId);
  const opponent = game.getPlayer(opponentId);
  const guardMinions = player.temporaryFlags.ignoreGuardThisTurn ? [] : getGuardMinions(game, opponentId);
  if (guardMinions.length) {
    return guardMinions.map((minion) => ({ type: "minion" as const, id: minion.instanceId, label: minion.name }));
  }

  return [
    { type: "hero" as const, id: `${opponentId}_hero`, label: "敌方英雄" },
    ...opponent.board
      .filter((minion) => canBeTargetedByCombat(minion, playerId))
      .map((minion) => ({ type: "minion" as const, id: minion.instanceId, label: minion.name }))
  ];
}

export function getPlayableCards(game: ShinDoroGame, playerId: PlayerId): RuntimeCard[] {
  if (game.state.winner || game.state.currentPlayer !== playerId || game.state.phase !== "mainTurn") return [];
  const player = game.getPlayer(playerId);
  return player.hand.filter((card) => card.currentCost <= player.mana && (card.type !== "minion" || player.board.length < 7));
}

export function getReadyAttackers(game: ShinDoroGame, playerId: PlayerId) {
  if (
    game.state.winner ||
    game.state.currentPlayer !== playerId ||
    (game.state.phase !== "mainTurn" && game.state.phase !== "combat")
  ) {
    return [];
  }
  return game.getPlayer(playerId).board.filter((minion) => minion.canAttack);
}

export function getAIAttackTargets(game: ShinDoroGame, attackerId: string, playerId: PlayerId) {
  return game.getAttackTargets(attackerId, playerId);
}

export function checkForDeaths(game: ShinDoroGame): void {
  let anyDeath = true;
  while (anyDeath) {
    anyDeath = false;
    for (const playerId of [PLAYER_ID, AI_ID]) {
      const player = game.getPlayer(playerId);
      const dead = player.board.filter((minion) => minion.health <= 0);
      if (!dead.length) continue;
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

export function checkGameOver(game: ShinDoroGame): boolean {
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
