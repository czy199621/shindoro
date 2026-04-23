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
  }
];
