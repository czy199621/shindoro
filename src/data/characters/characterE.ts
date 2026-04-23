import type { CharacterDefinition, PassiveAbility } from "../../types.js";

export const CHARACTER_E_PASSIVE: PassiveAbility = {
  key: "gainGodDrawOnBigDamage",
  name: "吃痛回气",
  description: "单次受到超过 3 点伤害时，获得 1 点神抽槽。"
};

export const CHARACTER_E_SLOT_ABILITIES: CharacterDefinition["slotAbilities"] = {
  jump10: {
    name: "强行穿透",
    description: "本回合无视护卫，并让对手下回合开始时少 2 点法力。",
    effects: [
      { type: "setIgnoreGuard", enabled: true },
      { type: "applyOpponentNextTurnManaPenalty", amount: 2 }
    ]
  },
  jump13: {
    name: "极限反扑",
    description: "本回合无视护卫，队伍攻击强化，并让对手下回合少 3 点法力。",
    effects: [
      { type: "setIgnoreGuard", enabled: true },
      { type: "buff", target: "allFriendlyMinions", atk: 1 },
      { type: "applyOpponentNextTurnManaPenalty", amount: 3 }
    ]
  }
};

export const CHARACTER_E: CharacterDefinition = {
  id: "character_e",
  name: "ggy",
  title: "反击节奏手",
  baseHp: 20,
  talentPoints: 4,
  description: "越挨打越容易攒出反击资源，擅长穿过护卫直接施压。",
  passive: CHARACTER_E_PASSIVE,
  slotAbilities: CHARACTER_E_SLOT_ABILITIES
};
