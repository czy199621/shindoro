import type { CardDefinition } from "../../../types.js";

export const TOKEN_AND_CHAIN_MINIONS: CardDefinition[] = [
  {
    id: "cache_kitten",
    name: "缓存小猫",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 1,
    threat: 1,
    description: "衍生。亡语：抽 1 张牌。",
    tags: ["token"],
    effects: [{ trigger: "onDeath", action: { type: "draw", count: 1 } }]
  },
  {
    id: "error_puppet",
    name: "报错木偶",
    cost: 4,
    type: "minion",
    attack: 1,
    health: 1,
    threat: 1,
    description: "衍生，垃圾。战吼：无事发生。",
    tags: ["token", "junk"],
    effects: []
  },
  {
    id: "cache_cub",
    name: "缓存幼猫",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 1,
    threat: 1,
    description: "亡语：将一张「备份碎片」置于你的牌库顶。",
    effects: [{ trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "backup_fragment" } }]
  },
  {
    id: "backup_messenger",
    name: "备份信使",
    cost: 2,
    type: "minion",
    attack: 1,
    health: 2,
    threat: 2,
    description: "亡语：将两张「备份碎片」置于你的牌库顶。",
    effects: [
      { trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "backup_fragment", count: 2 } }
    ]
  },
  {
    id: "offline_archivist",
    name: "离线归档员",
    cost: 2,
    type: "minion",
    attack: 2,
    health: 1,
    threat: 2,
    description: "亡语：将一张「缓存小猫」置于你的牌库顶。",
    effects: [{ trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "cache_kitten" } }]
  },
  {
    id: "broken_database",
    name: "破损数据库",
    cost: 3,
    type: "minion",
    attack: 0,
    health: 4,
    threat: 2,
    description: "亡语：将三张「备份碎片」置于你的牌库顶。",
    effects: [
      { trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "backup_fragment", count: 3 } }
    ]
  },
  {
    id: "primary_backup_body",
    name: "初级备份体",
    cost: 3,
    type: "minion",
    attack: 2,
    health: 2,
    threat: 2,
    description: "三叠链。亡语：将一张「中继归档体」置于你的牌库顶。",
    effects: [{ trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "relay_archive_body" } }]
  },
  {
    id: "relay_archive_body",
    name: "中继归档体",
    cost: 5,
    type: "minion",
    attack: 4,
    health: 5,
    threat: 4,
    description: "衍生，三叠链。亡语：将一张「深层灾备体」置于你的牌库顶。",
    tags: ["token"],
    effects: [{ trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "deep_backup_body" } }]
  },
  {
    id: "deep_backup_body",
    name: "深层灾备体",
    cost: 7,
    type: "minion",
    attack: 6,
    health: 7,
    threat: 6,
    description: "衍生，三叠链终点。亡语：抽 1 张牌。",
    tags: ["token"],
    effects: [{ trigger: "onDeath", action: { type: "draw", count: 1 } }]
  },
  {
    id: "anomaly_rollback_body",
    name: "异常回溯体",
    cost: 3,
    type: "minion",
    attack: 1,
    health: 2,
    threat: 2,
    description: "三叠链。亡语：若被敌方使魔通过战斗破坏，破坏那名使魔。然后将一张「深层回溯体」置于你的牌库顶。",
    effects: [
      { trigger: "onDeath", action: { type: "destroyCombatKiller" } },
      { trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "deep_rollback_body" } }
    ]
  },
  {
    id: "deep_rollback_body",
    name: "深层回溯体",
    cost: 5,
    type: "minion",
    attack: 3,
    health: 4,
    threat: 4,
    description: "衍生，三叠链。亡语：若被敌方使魔通过战斗破坏，破坏那名使魔。然后将一张「终端回溯体」置于你的牌库顶。",
    tags: ["token"],
    effects: [
      { trigger: "onDeath", action: { type: "destroyCombatKiller" } },
      { trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "terminal_rollback_body" } }
    ]
  },
  {
    id: "terminal_rollback_body",
    name: "终端回溯体",
    cost: 7,
    type: "minion",
    attack: 5,
    health: 6,
    threat: 6,
    description: "衍生，三叠链终点。亡语：若被敌方使魔通过战斗破坏，破坏那名使魔。",
    tags: ["token"],
    effects: [{ trigger: "onDeath", action: { type: "destroyCombatKiller" } }]
  },
  {
    id: "grave_lamp_wisp",
    name: "墓灯幼灵",
    cost: 3,
    type: "minion",
    attack: 2,
    health: 2,
    threat: 2,
    description: "三叠链。亡语：将一张「墓灯巡游者」置于你的牌库顶。若你的墓地中有 5 张以上卡牌，神抽槽 +1。",
    effects: [
      { trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "grave_lamp_parader" } },
      {
        trigger: "onDeath",
        action: { type: "ifOwnGraveyardAtLeast", count: 5, action: { type: "addSlot", slot: "godDraw", amount: 1 } }
      }
    ]
  },
  {
    id: "grave_lamp_parader",
    name: "墓灯巡游者",
    cost: 5,
    type: "minion",
    attack: 4,
    health: 4,
    threat: 4,
    description: "衍生，三叠链。战吼：若你的墓地中有 8 张以上卡牌，抽 1 张牌。亡语：将一张「墓灯守夜人」置于你的牌库顶。",
    tags: ["token"],
    effects: [
      { trigger: "onPlay", action: { type: "ifOwnGraveyardAtLeast", count: 8, action: { type: "draw", count: 1 } } },
      { trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "self", cardId: "grave_lamp_watchman" } }
    ]
  },
  {
    id: "grave_lamp_watchman",
    name: "墓灯守夜人",
    cost: 7,
    type: "minion",
    attack: 6,
    health: 6,
    threat: 6,
    description: "衍生，三叠链终点。战吼：若你的墓地中有 12 张以上卡牌，己方角色恢复 4 点生命。",
    tags: ["token"],
    effects: [
      { trigger: "onPlay", action: { type: "ifOwnGraveyardAtLeast", count: 12, action: { type: "heal", target: "selfHero", amount: 4 } } }
    ]
  },
  {
    id: "noise_imp",
    name: "噪声小鬼",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 1,
    threat: 1,
    description: "亡语：将一张「空白噪声」置于对手牌库顶。",
    effects: [{ trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "opponent", cardId: "blank_noise" } }]
  },
  {
    id: "mojibake_courier",
    name: "乱码投递员",
    cost: 3,
    type: "minion",
    attack: 2,
    health: 2,
    threat: 3,
    description: "亡语：将两张「空白噪声」置于对手牌库顶。",
    effects: [
      { trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "opponent", cardId: "blank_noise", count: 2 } }
    ]
  },
  {
    id: "garbage_compactor",
    name: "垃圾压缩机",
    cost: 4,
    type: "minion",
    attack: 3,
    health: 3,
    threat: 4,
    description: "亡语：将一张「报错木偶」置于对手牌库顶。",
    effects: [{ trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "opponent", cardId: "error_puppet" } }]
  },
  {
    id: "broken_compiler",
    name: "崩坏编译器",
    cost: 4,
    type: "minion",
    attack: 2,
    health: 4,
    threat: 4,
    description: "亡语：将一张「死循环脚本」置于对手牌库顶。",
    effects: [{ trigger: "onDeath", action: { type: "createCardOnTopDeck", target: "opponent", cardId: "infinite_loop_script" } }]
  },
  {
    id: "star_chart_apprentice",
    name: "星图学徒",
    cost: 2,
    type: "minion",
    attack: 2,
    health: 2,
    threat: 2,
    description: "战吼：观星 3。",
    effects: [{ trigger: "onPlay", action: { type: "scryDeck", target: "self", count: 3 } }]
  },
  {
    id: "omen_owl",
    name: "预兆猫头鹰",
    cost: 3,
    type: "minion",
    attack: 2,
    health: 3,
    threat: 3,
    description: "战吼：观星 4。你可以将其中一张牌置于牌库底。",
    effects: [{ trigger: "onPlay", action: { type: "scryDeck", target: "self", count: 4, bottomCount: 1 } }]
  }
];
