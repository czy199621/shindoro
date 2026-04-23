import type { CardDefinition } from "../../types.js";

export const TRAP_CARDS: CardDefinition[] = [
  {
    id: "mirror_wall",
    name: "镜像之墙",
    cost: 2,
    type: "trap",
    description: "触发：当敌方施放法术后，对敌方角色造成 3 点伤害。",
    effects: [
      {
        trigger: "onTriggerMet",
        condition: { type: "enemyCastsSpell" },
        action: { type: "damage", target: "enemyHero", amount: 3 }
      }
    ]
  },
  {
    id: "ambush_sigil",
    name: "伏击印记",
    cost: 2,
    type: "trap",
    description: "触发：当敌方召唤使魔后，对该使魔造成 2 点伤害。",
    effects: [
      {
        trigger: "onTriggerMet",
        condition: { type: "enemySummonsMinion" },
        action: { type: "damage", target: "triggeredMinion", amount: 2 }
      }
    ]
  }
];
