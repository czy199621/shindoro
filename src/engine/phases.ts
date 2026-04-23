import {
  chooseAiAction,
  chooseAiDeckCardForGodDraw,
  chooseAiReserveCard,
  shouldAiUseGodDrawSlot,
  shouldAiUseJumpSlot
} from "./ai.js";
import { calculateAdvantage, clamp, getAdvantageBreakdown, getSlotGain, groupDeckChoices, shuffle } from "./rules.js";
import type { LastAdvantage, PendingChoicePayload, PlayerId, PlayerState, RuntimeCard, TurnStartQueueItem } from "../types.js";
import type { ShinDoroGame } from "./gameState.js";

const PLAYER_ID: PlayerId = "P1";
const AI_ID: PlayerId = "P2";

function spendBurstSlot(player: PlayerState, slot: "jumpSlot" | "godDrawSlot", amount: number): void {
  const preserved = Math.max(0, player.temporaryFlags.preserveBurstSlotAmount);
  player[slot] = Math.max(player[slot] - amount, preserved);
}

function resetTurnScopedFlags(player: PlayerState): void {
  player.temporaryFlags.ignoreGuardThisTurn = false;
  player.temporaryFlags.millOnDamageTaken = 0;
  player.temporaryFlags.damageTakenThisTurn = 0;
}

function applyTurnStartPassives(game: ShinDoroGame, playerId: PlayerId): void {
  const player = game.getPlayer(playerId);
  const character = game.getCharacter(player.character);

  if (character.passive.key === "loseOneSlotAtTurnStart") {
    const slotToReduce =
      player.jumpSlot >= player.godDrawSlot && player.jumpSlot > 0
        ? "jumpSlot"
        : player.godDrawSlot > 0
          ? "godDrawSlot"
          : null;
    if (slotToReduce) {
      player[slotToReduce] -= 1;
      game.log(`${character.name} 的被动使 ${slotToReduce === "jumpSlot" ? "跳脸槽" : "神抽槽"} -1。`);
    }
  }

  if (character.passive.key === "loseHpAtTurnStart") {
    player.hp -= 1;
    game.log(`${character.name} 的被动使自己失去 1 点生命。`);
  }

  const lowHpHeal = player.temporaryFlags.lowHpTurnStartHeal;
  if (lowHpHeal && player.hp < lowHpHeal.threshold) {
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + lowHpHeal.amount);
    if (player.hp > before) {
      game.log(`${character.name} 因低血量天赋回复了 ${player.hp - before} 点生命。`);
    }
  }
}

function applyTurnStartMana(game: ShinDoroGame, playerId: PlayerId): void {
  const player = game.getPlayer(playerId);
  const manaPenalty = player.temporaryFlags.nextTurnManaPenalty;
  player.temporaryFlags.nextTurnManaPenalty = 0;

  player.maxMana = clamp(player.maxMana + 1, 0, 10);
  const openingBonusMana = player.temporaryFlags.openingBonusMana;
  player.temporaryFlags.openingBonusMana = 0;
  player.mana = clamp(player.maxMana - manaPenalty + openingBonusMana, 0, 10);
}

function readyBoardForTurn(player: PlayerState): void {
  for (const minion of player.board) {
    minion.canAttack = true;
    minion.summonedThisTurn = false;
    if (minion.tags.includes("rush")) {
      minion.canAttack = true;
    }
  }
}

function applyDrawPhaseEffects(game: ShinDoroGame, playerId: PlayerId): void {
  const player = game.getPlayer(playerId);
  const character = game.getCharacter(player.character);

  if (character.passive.key === "healOnDrawPhase") {
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + 1);
    if (player.hp > before) {
      game.log(`${character.name} 在抓牌阶段回复了 1 点生命。`);
    }
  }
}

export function completePlayerMulligan(game: ShinDoroGame, indices: number[]) {
  game.performMulligan(PLAYER_ID, indices);
  game.state.screen = "game";
  game.beginTurn();
  return game.state;
}

export function performMulligan(game: ShinDoroGame, playerId: PlayerId, indices: number[]): void {
  const player = game.getPlayer(playerId);
  const ordered = [...new Set(indices)].sort((a, b) => b - a);
  const returning: RuntimeCard[] = [];

  for (const index of ordered) {
    const card = player.hand[index];
    if (!card) continue;
    const [removed] = player.hand.splice(index, 1);
    if (removed) {
      returning.push(removed);
    }
  }

  if (!returning.length) {
    if (playerId === PLAYER_ID) {
      game.log("你选择了保留当前起手。");
    }
    return;
  }

  player.deck = shuffle([...player.deck, ...returning], game.rng);
  game.drawCards(playerId, returning.length, "换牌");

  if (playerId === PLAYER_ID) {
    game.log(`你重新抽取了 ${returning.length} 张起手牌。`);
  }
}

export function beginTurn(game: ShinDoroGame): void {
  if (game.state.winner) return;

  const player = game.getCurrentPlayer();
  resetTurnScopedFlags(player);

  game.state.phase = "turnStart";
  game.state.pendingChoice = null;
  game.state.turnStartQueue = [];
  game.state.selectedAttackerId = null;

  applyTurnStartPassives(game, player.id);
  applyTurnStartMana(game, player.id);
  readyBoardForTurn(player);

  game.checkGameOver();
  if (game.state.winner) return;

  game.log(`回合 ${game.state.turn} 开始：${game.getCharacter(player.character).name}`);
  game.buildTurnStartQueue(player.id);
  game.processTurnStartQueue();
}

export function buildTurnStartQueue(game: ShinDoroGame, playerId: PlayerId): void {
  const player = game.getPlayer(playerId);
  if (player.jumpSlot >= 13) {
    game.state.turnStartQueue.push({ type: "ultimateJump", playerId });
  }
  if (player.godDrawSlot >= 13) {
    game.state.turnStartQueue.push({ type: "ultimateGodDraw", playerId });
  }
  if (player.jumpSlot >= 10) {
    game.state.turnStartQueue.push({ type: "optionalJump", playerId });
  }
  if (player.godDrawSlot >= 10) {
    game.state.turnStartQueue.push({ type: "optionalGodDraw", playerId });
  }
}

export function processTurnStartQueue(game: ShinDoroGame): void {
  while (game.state.turnStartQueue.length) {
    const item = game.state.turnStartQueue[0] as TurnStartQueueItem;
    const player = game.getPlayer(item.playerId);

    if (item.type === "ultimateJump") {
      game.state.turnStartQueue.shift();
      player.jumpSlot = Math.max(0, player.temporaryFlags.preserveBurstSlotAmount);
      game.log("13 点跳脸槽强制触发 Overkill。", "alert");
      game.resolveCharacterSlot(item.playerId, "jump13");
      game.checkForDeaths();
      if (game.state.winner) return;
      continue;
    }

    if (item.type === "ultimateGodDraw") {
      if (item.playerId === AI_ID) {
        game.state.turnStartQueue.shift();
        const cardId = chooseAiReserveCard(game.state, item.playerId);
        game.resolveUltimateGodDraw(item.playerId, cardId);
        continue;
      }
      game.state.phase = "slotResolution";
      game.state.pendingChoice = {
        type: "ultimateGodDraw",
        playerId: item.playerId,
        title: "13 点神抽槽：从备牌库选择一张牌置于牌库顶",
        choices: groupDeckChoices(player.reserveDeck)
      };
      return;
    }

    if (item.type === "optionalJump") {
      if (player.jumpSlot < 10) {
        game.state.turnStartQueue.shift();
        continue;
      }
      if (item.playerId === AI_ID) {
        game.state.turnStartQueue.shift();
        if (shouldAiUseJumpSlot(game.state, item.playerId)) {
          spendBurstSlot(player, "jumpSlot", 10);
          game.log("AI 发动了 10 点跳脸槽。");
          game.resolveCharacterSlot(item.playerId, "jump10");
          game.checkForDeaths();
          if (game.state.winner) return;
        }
        continue;
      }
      game.state.phase = "slotResolution";
      game.state.pendingChoice = {
        type: "optionalJump",
        playerId: item.playerId,
        title: "是否发动 10 点跳脸槽",
        description: game.getCharacter(player.character).slotAbilities.jump10.description
      };
      return;
    }

    if (item.type === "optionalGodDraw") {
      if (player.godDrawSlot < 10) {
        game.state.turnStartQueue.shift();
        continue;
      }
      if (item.playerId === AI_ID) {
        game.state.turnStartQueue.shift();
        if (shouldAiUseGodDrawSlot(game.state, item.playerId)) {
          const cardId = chooseAiDeckCardForGodDraw(game.state, item.playerId);
          if (cardId) {
            game.resolveOptionalGodDraw(item.playerId, cardId);
          }
        }
        continue;
      }
      game.state.phase = "slotResolution";
      game.state.pendingChoice = {
        type: "optionalGodDraw",
        playerId: item.playerId,
        title: "是否发动 10 点神抽槽",
        description: "从牌库中指定 1 张牌置于牌库顶，并保留后续抓牌机会。",
        choices: groupDeckChoices(player.deck)
      };
      return;
    }
  }

  game.finishStartTurn();
}

export function finishStartTurn(game: ShinDoroGame): void {
  const player = game.getCurrentPlayer();

  game.resolveOnTurnStart(player.id);
  game.checkForDeaths();
  if (game.state.winner) return;

  game.state.phase = "draw";
  applyDrawPhaseEffects(game, player.id);
  game.drawCards(player.id, 1, "抓牌阶段");
  if (game.state.winner) return;

  game.state.phase = "mainTurn";
}

export function handlePendingChoice(game: ShinDoroGame, payload: PendingChoicePayload): void {
  const choice = game.state.pendingChoice;
  if (!choice) return;

  if (choice.type === "ultimateGodDraw") {
    game.state.turnStartQueue.shift();
    if (payload.cardId) {
      game.resolveUltimateGodDraw(choice.playerId, payload.cardId);
    }
    game.state.pendingChoice = null;
    game.processTurnStartQueue();
    return;
  }

  if (choice.type === "optionalJump") {
    game.state.turnStartQueue.shift();
    if (payload.action === "use") {
      const player = game.getPlayer(choice.playerId);
      spendBurstSlot(player, "jumpSlot", 10);
      game.log("你发动了 10 点跳脸槽。");
      game.resolveCharacterSlot(choice.playerId, "jump10");
      game.checkForDeaths();
    } else {
      game.log("你放弃了本次 10 点跳脸槽。");
    }
    game.state.pendingChoice = null;
    if (!game.state.winner) {
      game.processTurnStartQueue();
    }
    return;
  }

  if (choice.type === "optionalGodDraw") {
    game.state.turnStartQueue.shift();
    if (payload.action === "use" && payload.cardId) {
      game.resolveOptionalGodDraw(choice.playerId, payload.cardId);
    } else {
      game.log("你放弃了本次 10 点神抽槽。");
    }
    game.state.pendingChoice = null;
    game.processTurnStartQueue();
  }
}

export function endTurn(game: ShinDoroGame): boolean {
  if (game.state.phase !== "mainTurn" && game.state.phase !== "combat") return false;

  const currentPlayer = game.getCurrentPlayer();
  currentPlayer.temporaryFlags.ignoreGuardThisTurn = false;
  currentPlayer.temporaryFlags.millOnDamageTaken = 0;

  game.state.phase = "turnEnd";

  const p1 = game.state.players[PLAYER_ID];
  const p2 = game.state.players[AI_ID];
  const p1Breakdown = getAdvantageBreakdown(p1, p2);
  const value = calculateAdvantage(p1, p2);
  const gain = getSlotGain(value);

  game.state.lastAdvantage = {
    value,
    gain,
    p1Breakdown,
    summary: [
      `手牌 ${p1Breakdown.handScore >= 0 ? "+" : ""}${p1Breakdown.handScore}`,
      `血量 ${p1Breakdown.hpScore >= 0 ? "+" : ""}${p1Breakdown.hpScore}`,
      `场面 ${p1Breakdown.threatScore >= 0 ? "+" : ""}${p1Breakdown.threatScore}`,
      `特殊 ${p1Breakdown.specialScore >= 0 ? "+" : ""}${p1Breakdown.specialScore}`
    ]
  } as LastAdvantage;

  game.applyAdvantageSlots(value, gain);
  game.checkGameOver();
  if (game.state.winner) return false;

  game.state.currentPlayer = game.getOpponentId(game.state.currentPlayer);
  game.state.turn += 1;
  game.beginTurn();
  return true;
}

export function runAiTurn(game: ShinDoroGame): boolean {
  if (
    game.state.winner ||
    game.state.currentPlayer !== AI_ID ||
    (game.state.phase !== "mainTurn" && game.state.phase !== "combat")
  ) {
    return false;
  }

  let safety = 0;
  while (
    !game.state.winner &&
    game.state.currentPlayer === AI_ID &&
    (game.state.phase === "mainTurn" || game.state.phase === "combat") &&
    safety < 20
  ) {
    safety += 1;
    const action = chooseAiAction(game, AI_ID);
    if (!action || action.type === "endTurn") {
      game.endTurn();
      break;
    }
    if (action.type === "playCard") {
      game.playCardAtIndex(AI_ID, action.index);
    } else if (action.type === "attack") {
      game.attackWith(AI_ID, action.attackerId, action.targetId, action.targetType);
    }
  }

  return true;
}
