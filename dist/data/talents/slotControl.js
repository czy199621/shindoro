export const SLOT_CONTROL_TALENTS = [
    {
        id: "first_guardrail",
        name: "先手神抽护栏",
        category: "slotControl",
        pricing: { first: 1, second: null },
        availableFor: "first",
        repeatLimit: 1,
        description: "若你为先手，开局神抽槽 +2。",
        effect: { type: "openingSlotBonus", slot: "godDraw", amount: 2 }
    },
    {
        id: "second_counterpush",
        name: "后手跳脸反击",
        category: "slotControl",
        pricing: { first: null, second: 2 },
        availableFor: "second",
        repeatLimit: 1,
        description: "若你为后手，开局跳脸槽 +2。",
        effect: { type: "openingSlotBonus", slot: "jump", amount: 2 }
    }
];
