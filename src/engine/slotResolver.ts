import type { PlayerId, SlotAdjustOptions } from "../types.js";
import { removeFirstMatching } from "./rules.js";
import type { ShinDoroGame } from "./gameState.js";

export function resolveUltimateGodDraw(game: ShinDoroGame, playerId: PlayerId, cardId: string): void {
  const player = game.getPlayer(playerId);
  const picked = removeFirstMatching(player.reserveDeck, (card) => card.id === cardId) ?? player.reserveDeck.shift();
  if (!picked) return;
  player.deck.unshift({ ...picked, currentCost: picked.currentCost, baseCost: picked.baseCost });
  player.temporaryFlags.nextDrawDiscount = Math.max(player.temporaryFlags.nextDrawDiscount, 2);
  player.godDrawSlot = 0;
  game.log(`${game.getCharacter(player.character).name} 以 13 点神抽从备牌库指定了 ${picked.name}。`, "alert");
}

export function resolveOptionalGodDraw(game: ShinDoroGame, playerId: PlayerId, cardId: string): void {
  const player = game.getPlayer(playerId);
  const picked = removeFirstMatching(player.deck, (card) => card.id === cardId);
  if (!picked) return;
  player.deck.unshift(picked);
  player.godDrawSlot -= 10;
  game.log(`${game.getCharacter(player.character).name} 发动神抽，将 ${picked.name} 置于牌库顶。`);
}

export function resolveCharacterSlot(game: ShinDoroGame, playerId: PlayerId, tier: "jump10" | "jump13"): void {
  const player = game.getPlayer(playerId);
  const character = game.getCharacter(player.character);
  const ability = character.slotAbilities[tier];
  if (!ability) return;
  game.log(`${character.name} 发动 ${ability.name}。`, "alert");
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
    game.log(`${character.name} 因 ${reason} 获得 ${gained} 点${slotName}。`);
  }
  return gained;
}

export function applyAdvantageSlots(game: ShinDoroGame, value: number, gain: number): void {
  if (gain === 0) {
    game.log("本回合势能为 0，双方均未获得槽位。");
    return;
  }

  const advantagedId = value > 0 ? "P1" : "P2";
  const disadvantagedId = value > 0 ? "P2" : "P1";
  const disadvantagedCharacter = game.getCharacter(game.getPlayer(disadvantagedId).character);

  game.log(`势能结算：V = ${value >= 0 ? "+" : ""}${value}，档位为 ${gain}。`, Math.abs(value) >= 4 ? "alert" : "neutral");

  if (disadvantagedCharacter.passive.key === "smallDisadvantageCountsAsMedium" && gain === 1) {
    game.adjustSlot(disadvantagedId, "godDraw", 2, "角色被动");
    game.log(`${disadvantagedCharacter.name} 的被动生效：小劣势改判为中劣势。`, "alert");
    return;
  }

  game.adjustSlot(advantagedId, "jump", gain, "势能结算");
  game.adjustSlot(disadvantagedId, "godDraw", gain, "势能结算");
}
