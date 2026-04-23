import { getCardDefinition } from "../data/cards.js";
import type {
  CardDefinition,
  Effect,
  EffectAction,
  EffectContext,
  GameState,
  PendingChoicePayload,
  PlayerId,
  RuntimeCard
} from "../types.js";
import {
  createMinionInstance,
  createPersistentInstance,
  createRuntimeCard,
  removeFirstMatching
} from "./rules.js";
import type { ShinDoroGame } from "./gameState.js";

const PLAYER_ID: PlayerId = "P1";
const AI_ID: PlayerId = "P2";

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
        game.log(`${game.getCharacter(player.character).name} 已无牌可抽且无手牌可用，判负。`, "alert");
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
    game.log(`${card.name} 因战场已满无法被召唤。`);
    return null;
  }

  const instance = createMinionInstance(card, playerId);
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

export function resolveEffects(
  game: ShinDoroGame,
  playerId: PlayerId,
  effects: Effect[],
  context: EffectContext
): void {
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
        game.log(`${game.getCharacter(owner.character).name} 的陷阱 ${trap.name} 被触发。`, "alert");
        game.resolveAction(ownerId, effect.action, context);
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
        player.hp = Math.min(player.maxHp, player.hp + action.amount);
      } else if (action.target === "enemyHero") {
        opponent.hp = Math.min(opponent.maxHp, opponent.hp + action.amount);
      }
      break;
    case "draw":
      game.drawCards(playerId, action.count, "效果");
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
      resolveDestroyAction(game, playerId, action.target);
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

  if (action.target === "enemyHero") {
    opponent.hp -= action.amount;
    return;
  }

  if (action.target === "selfHero") {
    player.hp -= action.amount;
    return;
  }

  const affected = [];
  if (action.target === "allEnemyMinions") {
    affected.push(...opponent.board);
  } else if (action.target === "allFriendlyMinions") {
    affected.push(...player.board);
  } else if (action.target === "strongestEnemyMinion") {
    const strongest = [...opponent.board].sort((left, right) => right.attack - left.attack)[0];
    if (strongest) affected.push(strongest);
  } else if (action.target === "weakestEnemyMinion") {
    const weakest = [...opponent.board].sort((left, right) => left.attack - right.attack)[0];
    if (weakest) affected.push(weakest);
  } else if (action.target === "triggeredMinion" && context.triggeredMinion) {
    affected.push(context.triggeredMinion);
  }

  for (const unit of affected) {
    unit.health -= action.amount;
  }
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
  targetType: "strongestEnemyMinion" | "weakestEnemyMinion"
): void {
  const opponent = game.getOpponent(playerId);
  let target = null;
  if (targetType === "strongestEnemyMinion") {
    target = [...opponent.board].sort((left, right) => right.attack - left.attack)[0] ?? null;
  } else if (targetType === "weakestEnemyMinion") {
    target = [...opponent.board].sort((left, right) => left.attack - right.attack)[0] ?? null;
  }
  if (target) {
    target.health = 0;
  }
}

function resolveDiscardAction(
  game: ShinDoroGame,
  playerId: PlayerId,
  discardTarget: "self" | "opponent",
  count: number
): void {
  const targetPlayer = discardTarget === "self" ? game.getPlayer(playerId) : game.getOpponent(playerId);
  for (let index = 0; index < count; index += 1) {
    if (!targetPlayer.hand.length) break;
    const removed = targetPlayer.hand.pop();
    if (removed) {
      targetPlayer.graveyard.push({ id: removed.id, name: removed.name, runtimeId: removed.runtimeId });
    }
  }
}

function resolveSetTopDeck(game: ShinDoroGame, playerId: PlayerId, cardId: string): void {
  const player = game.getPlayer(playerId);
  const card = removeFirstMatching(player.deck, (item) => item.id === cardId);
  if (card) player.deck.unshift(card);
}

export function attack(game: ShinDoroGame, attackerId: string, targetId: string, targetType: "hero" | "minion"): boolean {
  const player = game.getCurrentPlayer();
  if (player.id !== PLAYER_ID || game.state.phase !== "mainTurn") return false;
  return game.attackWith(player.id, attackerId, targetId, targetType);
}

export function attackWith(
  game: ShinDoroGame,
  playerId: PlayerId,
  attackerId: string,
  targetId: string,
  targetType: "hero" | "minion"
): boolean {
  const player = game.getPlayer(playerId);
  const attacker = player.board.find((minion) => minion.instanceId === attackerId);
  if (!attacker || !attacker.canAttack) return false;
  const opponent = game.getOpponent(playerId);

  attacker.canAttack = false;
  if (targetType === "hero") {
    opponent.hp -= attacker.attack;
    game.log(`${attacker.name} 对敌方角色造成了 ${attacker.attack} 点伤害。`, "alert");
  } else {
    const defender = opponent.board.find((minion) => minion.instanceId === targetId);
    if (!defender) return false;
    defender.health -= attacker.attack;
    attacker.health -= defender.attack;
    game.log(`${attacker.name} 与 ${defender.name} 进行了交战。`);
  }

  game.checkForDeaths();
  game.checkGameOver();
  return true;
}

export function getAttackTargets(game: ShinDoroGame, attackerId: string, playerId: PlayerId) {
  const player = game.getPlayer(playerId);
  const attacker = player.board.find((minion) => minion.instanceId === attackerId);
  if (!attacker || !attacker.canAttack) return [];
  const opponent = game.getOpponent(playerId);
  return [
    { type: "hero" as const, id: `${game.getOpponentId(playerId)}_hero`, label: "敌方角色" },
    ...opponent.board.map((minion) => ({ type: "minion" as const, id: minion.instanceId, label: minion.name }))
  ];
}

export function getPlayableCards(game: ShinDoroGame, playerId: PlayerId): RuntimeCard[] {
  const player = game.getPlayer(playerId);
  return player.hand.filter((card) => card.currentCost <= player.mana);
}

export function getReadyAttackers(game: ShinDoroGame, playerId: PlayerId) {
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
        game.log(`${minion.name} 被送入墓地。`);
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
    game.log("双方同时倒下，判定为玩家败北。", "alert");
    return true;
  }
  if (player.hp <= 0) {
    game.state.winner = AI_ID;
    game.state.phase = "gameOver";
    game.log("你的生命值归零。", "alert");
    return true;
  }
  if (ai.hp <= 0) {
    game.state.winner = PLAYER_ID;
    game.state.phase = "gameOver";
    game.log("敌方生命值归零。你赢了。", "alert");
    return true;
  }
  return false;
}
