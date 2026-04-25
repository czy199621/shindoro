import type { TalentDefinition } from "../../types.js";

export const DECK_CONTROL_TALENTS: TalentDefinition[] = [
  {
    id: "foretold_scroll",
    name: "预示卷轴",
    category: "deckControl",
    pricing: { first: 5, second: 3 },
    availableFor: "both",
    repeatLimit: 1,
    description: "开局时将牌库中最低费的卡牌置于牌库顶。",
    effect: { type: "setTopDeckByRule", rule: "lowestCostCard" }
  },
  {
    id: "mental_pollution",
    name: "精神污染",
    category: "deckControl",
    pricing: { first: 3, second: 2 },
    availableFor: "both",
    repeatLimit: 1,
    description: "当你因超过手牌上限而烧掉牌时，对方随机弃置 1 张手牌。",
    effect: { type: "overflowOpponentDiscard", count: 1 }
  },
  {
    id: "void_backflow",
    name: "虚空倒灌",
    category: "deckControl",
    pricing: { first: 3, second: 2 },
    availableFor: "both",
    repeatLimit: 1,
    description: "当你因超过手牌上限而烧掉牌时，将敌方卡组顶端 3 张牌送入墓地。",
    effect: { type: "overflowOpponentMill", count: 3 }
  }
];
