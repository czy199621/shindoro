import {
  chooseAiAction,
  chooseAiDeckCardForGodDraw,
  chooseAiReserveCard,
  shouldAiUseGodDrawSlot,
  shouldAiUseJumpSlot
} from "./ai.js";
import { calculateAdvantage, clamp, getAdvantageBreakdown, getSlotGain, groupDeckChoices, shuffle } from "./rules.js";
import type { LastAdvantage, PendingChoicePayload, PlayerId, RuntimeCard, TurnStartQueueItem } from "../types.js";
import type { ShinDoroGame } from "./gameState.js";

const PLAYER_ID: PlayerId = "P1";
const AI_ID: PlayerId = "P2";

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
      game.log("你保留了全部起手牌。");
    }
    return;
  }

  player.deck = shuffle([...player.deck, ...returning], game.rng);
  game.drawCards(playerId, returning.length, "换牌");

  if (playerId === PLAYER_ID) {
    game.log(`你替换了 ${returning.length} 张起手牌。`);
  }
}

export function beginTurn(game: ShinDoroGame): void {
  if (game.state.winner) return;

  const player = game.getCurrentPlayer();
  game.state.phase = "turnStart";
  game.state.pendingChoice = null;
  game.state.turnStartQueue = [];
  game.state.selectedAttackerId = null;

  if (game.getCharacter(player.character).passive.key === "loseJumpAtTurnStart") {
    const before = player.jumpSlot;
    player.jumpSlot = Math.max(0, player.jumpSlot - 1);
    if (before !== player.jumpSlot) {
      game.log(`${game.getCharacter(player.character).name} 的被动使跳脸槽 -1。`);
    }
  }

  player.maxMana = clamp(player.maxMana + 1, 0, 10);
  player.mana = player.maxMana;

  for (const minion of player.board) {
    // Any minion that survives until its controller's next turn should ready here.
    minion.canAttack = true;
    minion.summonedThisTurn = false;
    if (minion.tags.includes("rush")) {
      minion.canAttack = true;
    }
  }

  game.log(`第 ${game.state.turn} 回合开始：${game.getCharacter(player.character).name}。`);
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
      game.log("13 点跳脸槽强制发动。", "alert");
      player.jumpSlot = 0;
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
        title: "13 点神抽槽：从备牌库选择一张牌",
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
          player.jumpSlot -= 10;
          game.log("AI 选择发动 10 点跳脸槽。");
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
        title: "你已达到 10 点跳脸槽",
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
        title: "你已达到 10 点神抽槽",
        description: "从你的牌库中指定 1 张牌置于牌库顶，然后本回合开始抽到它。",
        choices: groupDeckChoices(player.deck)
      };
      return;
    }
  }

  game.finishStartTurn();
}

export function finishStartTurn(game: ShinDoroGame): void {
  const player = game.getCurrentPlayer();
  game.drawCards(player.id, 1, "回合开始");
  if (game.state.winner) return;
  game.resolveOnTurnStart(player.id);
  game.checkForDeaths();
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
      player.jumpSlot -= 10;
      game.log("你发动了 10 点跳脸槽。");
      game.resolveCharacterSlot(choice.playerId, "jump10");
      game.checkForDeaths();
    } else {
      game.log("你选择暂不发动 10 点跳脸槽。");
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
      game.log("你选择暂不发动 10 点神抽槽。");
    }
    game.state.pendingChoice = null;
    game.processTurnStartQueue();
  }
}

export function endTurn(game: ShinDoroGame): boolean {
  if (game.state.phase !== "mainTurn") return false;

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
      `手牌差 ${p1Breakdown.handScore >= 0 ? "+" : ""}${p1Breakdown.handScore}`,
      `血量差 ${p1Breakdown.hpScore >= 0 ? "+" : ""}${p1Breakdown.hpScore}`,
      `威胁差 ${p1Breakdown.threatScore >= 0 ? "+" : ""}${p1Breakdown.threatScore}`,
      `特殊项 ${p1Breakdown.specialScore >= 0 ? "+" : ""}${p1Breakdown.specialScore}`
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
  if (game.state.winner || game.state.currentPlayer !== AI_ID || game.state.phase !== "mainTurn") {
    return false;
  }

  let safety = 0;
  while (!game.state.winner && game.state.currentPlayer === AI_ID && game.state.phase === "mainTurn" && safety < 20) {
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
