import type { CardDefinition } from "../../../types.js";

export const GUARD_PACKAGE_MINIONS: CardDefinition[] = [
{
    id: "landmine_girl",
    name: "地雷女",
    cost: 2,
    type: "minion",
    attack: 1,
    health: 4,
    threat: 4,
    description: "护卫。每当受到使魔攻击时，对敌方角色造成 2 点伤害。",
    tags: ["guard"],
    effects: [{ trigger: "onAttacked", action: { type: "damage", target: "enemyHero", amount: 2 } }]
  },
{
    id: "day_off",
    name: "调休",
    cost: 3,
    type: "minion",
    attack: 1,
    health: 3,
    threat: 3,
    description: "护卫。遗言：将一张“周末加班”加入手牌。",
    tags: ["guard"],
    effects: [{ trigger: "onDeath", action: { type: "addCardToHand", cardId: "weekend_overtime" } }]
  },
{
    id: "weekend_overtime",
    name: "周末加班",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 1,
    threat: 1,
    description: "护卫。",
    tags: ["guard"],
    effects: []
  },
{
    id: "dorm_matron",
    name: "宿管阿姨",
    cost: 4,
    type: "minion",
    attack: 0,
    health: 7,
    threat: 5,
    description: "护卫，威压。敌方所有使魔的基础威胁值减半。",
    tags: ["guard", "menace"],
    effects: []
  },
{
    id: "iron_rice_bowl",
    name: "铁饭碗",
    cost: 5,
    type: "minion",
    attack: 2,
    health: 6,
    threat: 5,
    description: "护卫，魔抗。无法被对方魔法指定。",
    tags: ["guard", "magicRes"],
    effects: []
  },
{
    id: "three_phase_plug",
    name: "三相插头",
    cost: 6,
    type: "minion",
    attack: 3,
    health: 5,
    threat: 4,
    description: "护卫。进场时：相邻的使魔获得护卫。",
    tags: ["guard"],
    effects: [{ trigger: "onPlay", action: { type: "grantAdjacentGuard" } }]
  },
{
    id: "top_donor",
    name: "榜一大哥",
    cost: 7,
    type: "minion",
    attack: 4,
    health: 8,
    threat: 7,
    description: "护卫。进场时：为己方角色回复 5 点 HP。若进场时己方 HP 低于 10，则自身获得 +2/+2。",
    tags: ["guard"],
    effects: [
      { trigger: "onPlay", action: { type: "buffSelfIfHeroHpBelow", threshold: 10, atk: 2, hp: 2 } },
      { trigger: "onPlay", action: { type: "heal", target: "selfHero", amount: 5 } }
    ]
  }
];
