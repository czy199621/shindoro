import type { TalentDefinition } from "../../types.js";

export const BURST_TALENTS: TalentDefinition[] = [
  {
    id: "burst_memory",
    name: "爆发记忆",
    category: "burst",
    pricing: { first: 3, second: 2 },
    availableFor: "both",
    repeatLimit: 1,
    description: "触发大招后，保留最多 3 点跳脸槽。",
    effect: { type: "retainSlotAfterBurst", amount: 3 }
  }
];
