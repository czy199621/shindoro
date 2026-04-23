import type { CharacterDefinition, PassiveAbility } from "../../types.js";

export const CHARACTER_C_PASSIVE: PassiveAbility = {
  key: "loseOneSlotAtTurnStart",
  name: "槽位耗散",
  description: "每回合开始时，跳脸槽或神抽槽会被扣除 1 点。"
};

export const CHARACTER_C_SLOT_ABILITIES: CharacterDefinition["slotAbilities"] = {
  jump10: {
    name: "全军进击",
    description: "本回合我方所有使魔攻击力强化 +3。",
    effects: [{ type: "buff", target: "allFriendlyMinions", atk: 3 }]
  },
  jump13: {
    name: "狂热升格",
    description: "本回合我方所有使魔获得 +4/+4 的爆发强化。",
    effects: [{ type: "buff", target: "allFriendlyMinions", atk: 4, hp: 4 }]
  }
};

export const CHARACTER_C: CharacterDefinition = {
  id: "character_c",
  name: "大奶",
  title: "场面滚雪球",
  baseHp: 20,
  talentPoints: 7,
  description: "依赖场面站住后打出超高面板压制，但槽位增长会被自身拖慢。",
  passive: CHARACTER_C_PASSIVE,
  slotAbilities: CHARACTER_C_SLOT_ABILITIES
};
