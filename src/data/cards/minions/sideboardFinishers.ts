import type { CardDefinition } from "../../../types.js";

export const SIDEBOARD_FINISHER_MINIONS: CardDefinition[] = [
  {
    id: "ouroboros_time_usurper",
    name: "时空篡夺者·乌洛波洛斯",
    cost: 9,
    type: "minion",
    attack: 2,
    health: 2,
    threat: 2,
    description: "进场时，在本回合结束后获得一个额外回合。若该额外回合结束时仍未击败对手，你将败北。",
    tags: ["sideboardFinisher"],
    effects: [{ trigger: "onPlay", action: { type: "grantExtraTurn", loseIfNoWin: true } }]
  },
  {
    id: "michael_divine_executor",
    name: "神罚代行者·米迦勒",
    cost: 9,
    type: "minion",
    attack: 8,
    health: 8,
    threat: 8,
    description: "护卫，必杀。进场时，放逐场上所有魔法卡，并破坏除此卡外的所有使魔。每移除一张卡牌，为你的角色回复 1 点生命。",
    tags: ["sideboardFinisher", "guard", "deadly"],
    effects: [{ trigger: "onPlay", action: { type: "purgeAllMagicAndOtherMinions", healPerRemoved: 1 } }]
  },
  {
    id: "chaos_imaginary_shadow",
    name: "虚数之影·卡奥斯",
    cost: 8,
    type: "minion",
    attack: 0,
    health: 5,
    threat: 3,
    description: "护卫。进场时，若敌方卡组数量大于 7 张，将敌方卡组顶端至多 15 张送入墓地，但会在敌方卡组仅剩 7 张时停止。",
    tags: ["sideboardFinisher", "guard"],
    effects: [
      {
        trigger: "onPlay",
        action: { type: "millDeckUntilRemaining", target: "opponent", remaining: 7, onlyIfAbove: 7, maxCount: 15 }
      }
    ]
  },
  {
    id: "shun_shadow_assassin",
    name: "绝影刺客·瞬",
    cost: 10,
    type: "minion",
    attack: 7,
    health: 1,
    threat: 4,
    description: "疾风。此使魔攻击时无视敌方护卫，可以直接攻击敌方角色或任意可攻击的敌方使魔。",
    tags: ["sideboardFinisher", "rush", "ignoreGuard"],
    effects: []
  },
  {
    id: "justitia_absolute_judge",
    name: "绝对裁决者·尤斯蒂娅",
    cost: 10,
    type: "minion",
    attack: 4,
    health: 12,
    threat: 10,
    description: "护卫，吸血。只要该使魔在场，双方无法发动跳脸或神抽。进场时，交换双方角色的当前生命值。",
    tags: ["sideboardFinisher", "guard", "lifesteal", "slotSeal"],
    effects: [{ trigger: "onPlay", action: { type: "swapHeroHp" } }]
  }
];
