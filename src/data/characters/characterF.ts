import type { CharacterDefinition, PassiveAbility } from "../../types.js";

export const CHARACTER_F_PASSIVE: PassiveAbility = {
  key: "healOnDrawPhase",
  name: "摸牌回春",
  description: "进入自己的抓牌阶段时，先回复 1 点生命。"
};

export const CHARACTER_F_SLOT_ABILITIES: CharacterDefinition["slotAbilities"] = {
  jump10: {
    name: "十连磨牌",
    description: "令对手从牌库顶失去 10 张牌。",
    effects: [{ type: "millDeck", target: "opponent", count: 10 }]
  },
  jump13: {
    name: "反伤磨尽",
    description: "先磨对手 10 张牌，并在本回合把你受到的伤害转化为额外磨牌。",
    effects: [
      { type: "millDeck", target: "opponent", count: 10 },
      { type: "setMillOnDamageTaken", amount: 1 }
    ]
  }
};

export const CHARACTER_F: CharacterDefinition = {
  id: "character_f",
  name: "寒尘",
  title: "磨牌压制者",
  baseHp: 20,
  talentPoints: 4,
  description: "通过磨牌和反伤联动拖垮对手的牌库资源。",
  passive: CHARACTER_F_PASSIVE,
  slotAbilities: CHARACTER_F_SLOT_ABILITIES
};
