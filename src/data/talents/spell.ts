import type { TalentDefinition } from "../../types.js";

export const SPELL_TALENTS: TalentDefinition[] = [
  {
    id: "spell_focus",
    name: "法术专注",
    category: "spell",
    pricing: { first: 3, second: 2 },
    availableFor: "both",
    repeatLimit: 1,
    description: "你的法术伤害 +1。",
    effect: { type: "increaseSpellDamage", amount: 1 }
  }
];
