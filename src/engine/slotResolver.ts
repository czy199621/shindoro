import type { PlayerId, SlotAdjustOptions } from "../types.js";
import { removeFirstMatching } from "./rules.js";
import type { ShinDoroGame } from "./gameState.js";

function getPreservedSlotValue(game: ShinDoroGame, playerId: PlayerId): number {
  return Math.max(0, game.getPlayer(playerId).temporaryFlags.preserveBurstSlotAmount);
}

function areSlotAbilitiesDisabled(game: ShinDoroGame): boolean {
  return Object.values(game.state.players).some((player) =>
    player.board.some((minion) => minion.tags.includes("slotSeal"))
  );
}

export function resolveUltimateGodDraw(game: ShinDoroGame, playerId: PlayerId, cardId: string): void {
  if (areSlotAbilitiesDisabled(game)) {
    game.log("跳脸与神抽被封锁，13 点神抽无法发动。", "alert");
    return;
  }
  const player = game.getPlayer(playerId);
  const picked = removeFirstMatching(player.reserveDeck, (card) => card.id === cardId) ?? player.reserveDeck.shift();
  if (!picked) {
    player.godDrawSlot = getPreservedSlotValue(game, playerId);
    game.log(`${game.getCharacter(player.character).name} 的备牌库为空，13 点神抽槽没有找到可加入的牌。`);
    return;
  }

  player.deck.unshift({ ...picked, currentCost: picked.currentCost, baseCost: picked.baseCost });
  player.temporaryFlags.nextDrawDiscount = Math.max(player.temporaryFlags.nextDrawDiscount, 2);
  player.godDrawSlot = getPreservedSlotValue(game, playerId);
  game.log(`${game.getCharacter(player.character).name} 通过 13 点神抽槽把 ${picked.name} 放到了牌库顶。`, "alert");
}

export function resolveOptionalGodDraw(game: ShinDoroGame, playerId: PlayerId, cardId: string): void {
  if (areSlotAbilitiesDisabled(game)) {
    game.log("跳脸与神抽被封锁，10 点神抽无法发动。", "alert");
    return;
  }
  const player = game.getPlayer(playerId);
  const picked = removeFirstMatching(player.deck, (card) => card.id === cardId);
  if (!picked) return;

  player.deck.unshift(picked);
  player.godDrawSlot = Math.max(player.godDrawSlot - 10, getPreservedSlotValue(game, playerId));
  game.log(`${game.getCharacter(player.character).name} 指定了下一抽为 ${picked.name}。`);
}

export function resolveCharacterSlot(game: ShinDoroGame, playerId: PlayerId, tier: "jump10" | "jump13"): void {
  if (areSlotAbilitiesDisabled(game)) {
    game.log("跳脸与神抽被封锁，角色大招无法发动。", "alert");
    return;
  }
  const player = game.getPlayer(playerId);
  const character = game.getCharacter(player.character);
  const ability = character.slotAbilities[tier];
  if (!ability) return;

  game.log(`${character.name} 发动了 ${ability.name}。`, "alert");
  for (const action of ability.effects) {
    game.resolveAction(playerId, action, {});
  }
}

export function adjustSlot(
  game: ShinDoroGame,
  playerId: PlayerId,
  slot: "jump" | "godDraw",
  amount: number,
  reason = "效果",
  options: SlotAdjustOptions = {}
): number {
  if (amount <= 0) return 0;

  const player = game.getPlayer(playerId);
  const character = game.getCharacter(player.character);
  let total = amount;

  if (!options.skipTalentModifier) {
    total += player.temporaryFlags.slotGainModifier[slot] ?? 0;
  }

  if (slot === "jump" && character.passive.key === "bonusJumpOnGain" && !options.skipCharacterPassive) {
    total += 1;
  }

  const key = slot === "jump" ? "jumpSlot" : "godDrawSlot";
  const before = player[key];
  player[key] = Math.min(13, player[key] + total);
  const gained = player[key] - before;

  if (gained > 0) {
    const slotName = slot === "jump" ? "跳脸槽" : "神抽槽";
    game.log(`${character.name} 因 ${reason} 获得了 ${gained} 点${slotName}。`);
  }

  return gained;
}

export function applyAdvantageSlots(game: ShinDoroGame, value: number, gain: number): void {
  if (gain === 0) {
    game.log("本回合势能差为 0，双方都不会获得槽位。");
    return;
  }

  const advantagedId = value > 0 ? "P1" : "P2";
  const disadvantagedId = value > 0 ? "P2" : "P1";
  const disadvantagedCharacter = game.getCharacter(game.getPlayer(disadvantagedId).character);

  game.log(`势能差结算为 ${value >= 0 ? "+" : ""}${value}，本次槽位收益为 ${gain}。`, Math.abs(value) >= 4 ? "alert" : "neutral");

  if (disadvantagedCharacter.passive.key === "extraGodDrawOnDisadvantage" && gain === 1) {
    game.adjustSlot(disadvantagedId, "godDraw", gain + 2, "角色被动");
    game.log(`${disadvantagedCharacter.name} 的被动额外强化了劣势方的神抽槽。`, "alert");
    return;
  }

  game.adjustSlot(advantagedId, "jump", gain, "势能结算");
  game.adjustSlot(disadvantagedId, "godDraw", gain, "势能结算");
}
