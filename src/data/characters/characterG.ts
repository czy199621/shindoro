import type { CharacterDefinition, PassiveAbility } from "../../types.js";

export const CHARACTER_G_PASSIVE: PassiveAbility = {
  key: "handDestructionMastery",
  name: "空心撕裂",
  description: "泉亚猫的大招在对手手牌不足时，会把弃牌压力转化为直接生命损失。"
};

export const CHARACTER_G_SLOT_ABILITIES: CharacterDefinition["slotAbilities"] = {
  jump10: {
    name: "精神撕扯",
    description: "随机弃置对方 2 张手牌；若对方只有 1 张手牌，弃置该牌并额外失去 4 点生命；若对方没有手牌，额外失去 8 点生命。",
    effects: [
      {
        type: "discardWithEmptyHandDamage",
        target: "opponent",
        count: 2,
        mode: "random",
        damageIfOne: 4,
        damageIfZero: 8
      }
    ]
  },
  jump13: {
    name: "空白审讯",
    description: "精准弃置对方 2 张最高费用手牌；若对方只有 1 张手牌，弃置该牌并额外失去 4 点生命；若对方没有手牌，额外失去 8 点生命。",
    effects: [
      {
        type: "discardWithEmptyHandDamage",
        target: "opponent",
        count: 2,
        mode: "highestCost",
        damageIfOne: 4,
        damageIfZero: 8
      }
    ]
  }
};

export const CHARACTER_G: CharacterDefinition = {
  id: "character_g",
  name: "泉亚猫",
  title: "精神破坏者",
  baseHp: 20,
  talentPoints: 4,
  description: "擅长手牌破坏、爆牌联动与极限控制，把对手的资源空洞转化为真实伤害。",
  passive: CHARACTER_G_PASSIVE,
  slotAbilities: CHARACTER_G_SLOT_ABILITIES
};
