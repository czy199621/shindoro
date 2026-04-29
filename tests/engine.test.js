import test from "node:test";
import assert from "node:assert/strict";

import { getCardDefinition } from "../.test-dist/data/cards.js";
import { CHARACTERS } from "../.test-dist/data/characters.js";
import { STARTING_DECKS } from "../.test-dist/data/decks.js";
import { TALENT_LOOKUP, getTalentCost } from "../.test-dist/data/talents.js";
import {
  calculateAdvantage,
  createPersistentInstance,
  createRuntimeCard,
  getAdvantageBreakdown,
  getBackrowSlotCount,
  getSlotGain,
  MAX_BACKROW_SLOTS,
  MAX_MINION_SLOTS,
} from "../.test-dist/engine/rules.js";
import { ShinDoroGame } from "../.test-dist/engine/gameState.js";
import { chooseAiAction, chooseAiMulliganIndices, chooseAiTalentIds } from "../.test-dist/engine/ai.js";

test("advantage formula returns positive score for better board and hand", () => {
  const me = {
    hp: 20,
    hand: [{}, {}, {}],
    deck: [{}, {}, {}, {}, {}, {}],
    board: [{ attack: 3, health: 3, threat: 4 }],
    persistents: []
  };
  const opp = {
    hp: 15,
    hand: [{}],
    deck: [{}, {}, {}, {}, {}, {}],
    board: [],
    persistents: []
  };

  assert.equal(calculateAdvantage(me, opp), 7);
});

test("advantage breakdown exposes hand hp threat and special score components", () => {
  const me = {
    hp: 8,
    hand: [{}, {}, {}],
    deck: [{}, {}, {}, {}],
    board: [{ attack: 3, health: 3, threat: 4 }],
    persistents: [{ threat: 1 }]
  };
  const opp = {
    hp: 15,
    hand: [{}],
    deck: [{}, {}, {}, {}, {}, {}],
    board: [{ attack: 6, health: 2, threat: 3 }],
    persistents: []
  };

  const breakdown = getAdvantageBreakdown(me, opp);

  assert.deepEqual(
    {
      handScore: breakdown.handScore,
      hpScore: breakdown.hpScore,
      threatScore: breakdown.threatScore,
      specialScore: breakdown.specialScore,
      total: breakdown.total
    },
    {
      handScore: 2,
      hpScore: -1,
      threatScore: 2,
      specialScore: -2,
      total: 1
    }
  );
  assert.deepEqual(breakdown.details, ["牌库见底 -2"]);
});

test("menace halves opposing minion threat while keeping its own threat intact", () => {
  const me = {
    hp: 20,
    hand: [],
    deck: [{}, {}, {}, {}, {}, {}],
    board: [{ attack: 3, health: 3, threat: 4, tags: [] }],
    persistents: []
  };
  const opp = {
    hp: 20,
    hand: [],
    deck: [{}, {}, {}, {}, {}, {}],
    board: [{ attack: 0, health: 7, threat: 5, tags: ["guard", "menace"] }],
    persistents: []
  };

  const breakdown = getAdvantageBreakdown(me, opp);

  assert.equal(breakdown.threatScore, -3);
  assert.equal(breakdown.total, -3);
});

test("slot gain uses 1/2/3 breakpoints", () => {
  assert.equal(getSlotGain(0), 0);
  assert.equal(getSlotGain(2), 1);
  assert.equal(getSlotGain(5), 2);
  assert.equal(getSlotGain(9), 3);
});

test("starting decks use legal card ids, 50-card main decks, public sideboards, and 3-copy limit", () => {
  for (const character of CHARACTERS) {
    assert.ok(STARTING_DECKS[character.id], `${character.id} is missing a starting deck`);
  }

  for (const deck of Object.values(STARTING_DECKS)) {
    assert.equal(deck.mainDeck.length, 50);
    assert.equal(deck.sideboard.length, 5);
    assert.deepEqual(deck.sideboard, [
      "ouroboros_time_usurper",
      "michael_divine_executor",
      "chaos_imaginary_shadow",
      "shun_shadow_assassin",
      "justitia_absolute_judge"
    ]);

    const counts = new Map();
    for (const cardId of deck.mainDeck) {
      assert.ok(getCardDefinition(cardId));
      counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
    }
    for (const cardId of deck.sideboard) {
      assert.ok(getCardDefinition(cardId));
    }

    for (const count of counts.values()) {
      assert.ok(count <= 3);
    }
  }
});

test("talents use dynamic first/second pricing", () => {
  assert.equal(getTalentCost(TALENT_LOOKUP.opening_insight, "first"), 4);
  assert.equal(getTalentCost(TALENT_LOOKUP.opening_insight, "second"), 2);
  assert.equal(getTalentCost(TALENT_LOOKUP.first_guardrail, "first"), 1);
  assert.equal(getTalentCost(TALENT_LOOKUP.first_guardrail, "second"), null);
  assert.equal(getTalentCost(TALENT_LOOKUP.second_counterpush, "first"), null);
  assert.equal(getTalentCost(TALENT_LOOKUP.second_counterpush, "second"), 2);
  assert.equal(getTalentCost(TALENT_LOOKUP.jump_cap_breakthrough, "first"), 2);
  assert.equal(getTalentCost(TALENT_LOOKUP.god_draw_cap_breakthrough, "second"), 1);
  assert.equal(getTalentCost(TALENT_LOOKUP.giant_stride, "first"), 3);
  assert.equal(getTalentCost(TALENT_LOOKUP.mana_breakthrough, "first"), 2);
  assert.equal(getTalentCost(TALENT_LOOKUP.abyssal_mana, "second"), 3);
  assert.equal(getTalentCost(TALENT_LOOKUP.mental_pollution, "second"), 2);
  assert.equal(getTalentCost(TALENT_LOOKUP.void_backflow, "first"), 3);
  assert.equal(getTalentCost(TALENT_LOOKUP.grace_surge, "first"), 1);
});

test("AI talent profiles stay legal for both seats", () => {
  for (const character of CHARACTERS) {
    for (const seat of ["first", "second"]) {
      const talentIds = chooseAiTalentIds(character.id, seat);
      let spent = 0;
      const counts = new Map();

      for (const talentId of talentIds) {
        const talent = TALENT_LOOKUP[talentId];
        const cost = getTalentCost(talent, seat);
        assert.notEqual(cost, null, `${character.id} picked unavailable ${talentId} for ${seat}`);
        spent += cost;
        counts.set(talentId, (counts.get(talentId) ?? 0) + 1);
        assert.ok(counts.get(talentId) <= talent.repeatLimit);
      }

      assert.ok(spent <= character.talentPoints);
    }
  }
});

test("Kapipara AI locks hand limit and max hp talents", () => {
  for (const seat of ["first", "second"]) {
    const talentIds = chooseAiTalentIds("character_b", seat);
    assert.ok(talentIds.includes("wide_grip"), `Kapipara should take wide_grip for ${seat}`);
    assert.ok(talentIds.includes("vitality_ritual"), `Kapipara should take vitality_ritual for ${seat}`);
  }
});

test("chaos mills up to fifteen cards but stops at seven remaining", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const ai = game.getState().players.P2;
  ai.deck = Array.from({ length: 30 }, () => createRuntimeCard(getCardDefinition("burn")));

  game.summonMinion("P1", getCardDefinition("chaos_imaginary_shadow"), {
    triggerOnPlay: true,
    canTriggerTrap: false
  });

  assert.equal(ai.deck.length, 15);
  assert.equal(ai.graveyard.filter((card) => card.id === "burn").length, 15);

  ai.deck = Array.from({ length: 10 }, () => createRuntimeCard(getCardDefinition("burn")));

  game.summonMinion("P1", getCardDefinition("chaos_imaginary_shadow"), {
    triggerOnPlay: true,
    canTriggerTrap: false
  });
  assert.equal(ai.deck.length, 7);
  assert.equal(ai.graveyard.filter((card) => card.id === "burn").length, 18);
});

test("shun ignores guard when choosing attack targets", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const shun = game.summonMinion("P1", getCardDefinition("shun_shadow_assassin"), { canTriggerTrap: false });
  game.summonMinion("P2", getCardDefinition("landmine_girl"), { canTriggerTrap: false });

  const targets = game.getAttackTargets(shun.instanceId, "P1").map((target) => target.id);
  assert.ok(targets.includes("P2_hero"));

  const hpBefore = game.getState().players.P2.hp;
  assert.equal(game.attackWith("P1", shun.instanceId, "P2_hero", "hero"), true);
  assert.equal(game.getState().players.P2.hp, hpBefore - 7);
});

test("justitia swaps hp and blocks slot abilities while on board", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.players.P1.hp = 6;
  state.players.P2.hp = 18;
  state.players.P1.jumpSlot = 13;

  game.summonMinion("P1", getCardDefinition("justitia_absolute_judge"), {
    triggerOnPlay: true,
    canTriggerTrap: false
  });

  assert.equal(state.players.P1.hp, 18);
  assert.equal(state.players.P2.hp, 6);

  game.beginTurn();

  assert.equal(state.pendingChoice, null);
  assert.equal(state.phase, "mainTurn");
  assert.equal(state.players.P1.jumpSlot, 13);
});

test("michael purges magic cards and all other minions then heals", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.players.P1.hp = 10;
  game.summonMinion("P1", getCardDefinition("ember_wolf"), { canTriggerTrap: false });
  game.summonMinion("P2", getCardDefinition("shield_doll"), { canTriggerTrap: false });
  state.players.P1.persistents.push({
    instanceId: "persistent_test_1",
    ownerId: "P1",
    sourceCardId: "war_banner",
    name: "战祀旗",
    threat: 2,
    description: "",
    effects: [],
    type: "persistent"
  });
  state.players.P2.traps.push({
    instanceId: "trap_test_1",
    ownerId: "P2",
    sourceCardId: "mirror_wall",
    name: "镜像之墙",
    threat: 0,
    description: "",
    effects: [],
    type: "trap"
  });

  const michael = game.summonMinion("P1", getCardDefinition("michael_divine_executor"), {
    triggerOnPlay: true,
    canTriggerTrap: false
  });
  game.checkForDeaths();

  assert.equal(state.players.P1.board.length, 1);
  assert.equal(state.players.P1.board[0].instanceId, michael.instanceId);
  assert.equal(state.players.P2.board.length, 0);
  assert.equal(state.players.P1.persistents.length, 0);
  assert.equal(state.players.P2.traps.length, 0);
  assert.equal(state.players.P1.hp, 14);
});

test("ouroboros grants one risky extra turn", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.phase = "mainTurn";

  game.summonMinion("P1", getCardDefinition("ouroboros_time_usurper"), {
    triggerOnPlay: true,
    canTriggerTrap: false
  });
  game.endTurn();

  assert.equal(state.currentPlayer, "P1");
  assert.equal(state.winner, null);

  state.phase = "mainTurn";
  game.endTurn();

  assert.equal(state.winner, "P2");
});

test("high-level magic clears boards support cards traps and next-turn mana", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  game.summonMinion("P1", getCardDefinition("ember_wolf"), { canTriggerTrap: false });
  game.summonMinion("P2", getCardDefinition("shield_doll"), { canTriggerTrap: false });
  game.resolveAction("P1", { type: "destroyAllEnemyMinions" }, {});
  game.checkForDeaths();
  assert.equal(state.players.P1.board.length, 1);
  assert.equal(state.players.P2.board.length, 0);

  state.players.P2.persistents.push({
    instanceId: "persistent_test_2",
    ownerId: "P2",
    sourceCardId: "war_banner",
    name: "战祀旗",
    threat: 2,
    description: "",
    effects: [],
    type: "persistent"
  });
  state.players.P2.traps.push({
    instanceId: "trap_test_2",
    ownerId: "P2",
    sourceCardId: "mirror_wall",
    name: "镜像之墙",
    threat: 0,
    description: "",
    effects: [],
    type: "trap"
  });

  game.resolveAction("P1", { type: "destroyPersistents", target: "enemy" }, {});
  game.resolveAction("P1", { type: "destroyEnemyTraps" }, {});
  assert.equal(state.players.P2.persistents.length, 0);
  assert.equal(state.players.P2.traps.length, 0);

  state.players.P2.maxMana = 5;
  state.players.P2.temporaryFlags.openingBonusMana = 0;
  game.resolveAction("P1", { type: "applyOpponentNextTurnManaMultiplier", multiplier: 0.5 }, {});
  state.currentPlayer = "P2";
  game.beginTurn();
  assert.equal(state.players.P2.maxMana, 6);
  assert.equal(state.players.P2.mana, 3);
});

test("time usurpation grants an extra turn with twelve mana", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.players.P1.hand = [createRuntimeCard(getCardDefinition("time_usurpation"))];
  state.players.P1.maxMana = 10;
  state.players.P1.mana = 10;
  state.phase = "mainTurn";

  assert.equal(game.playCardAtIndex("P1", 0), true);
  assert.equal(game.endTurn(), true);
  assert.equal(state.currentPlayer, "P1");
  assert.equal(state.phase, "mainTurn");
  assert.equal(state.players.P1.maxMana, 12);
  assert.equal(state.players.P1.mana, 12);
});

test("great mana gem is locked before turn five and scales on turn seven", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.players.P1.hand = [createRuntimeCard(getCardDefinition("great_mana_gem"))];
  state.players.P1.mana = 0;
  state.phase = "mainTurn";
  state.turn = 4;
  assert.equal(game.playCardAtIndex("P1", 0), false);
  assert.equal(state.players.P1.mana, 0);

  state.players.P1.hand = [createRuntimeCard(getCardDefinition("great_mana_gem"))];
  state.turn = 5;
  assert.equal(game.playCardAtIndex("P1", 0), true);
  assert.equal(state.players.P1.mana, 2);

  state.players.P1.hand = [createRuntimeCard(getCardDefinition("great_mana_gem"))];
  state.players.P1.mana = 0;
  state.turn = 7;
  assert.equal(game.playCardAtIndex("P1", 0), true);
  assert.equal(state.players.P1.mana, 3);
});

test("mana drain trap fires when enemy current mana equals five", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.players.P2.traps.push({
    instanceId: "trap_mana_drain",
    ownerId: "P2",
    sourceCardId: "mana_drain",
    name: "魔力干涸",
    threat: 0,
    description: "",
    effects: getCardDefinition("mana_drain").effects,
    type: "trap"
  });
  state.players.P1.maxMana = 4;
  state.players.P1.mana = 0;
  state.currentPlayer = "P1";

  game.beginTurn();

  assert.equal(state.players.P1.maxMana, 5);
  assert.equal(state.players.P1.mana, 2);
  assert.equal(state.players.P2.traps.length, 0);
  assert.equal(state.players.P2.graveyard.some((card) => card.id === "mana_drain"), true);
});

test("new spells and spell focus use updated damage values", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: ["spell_focus"]
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.players.P1.hand = [createRuntimeCard(getCardDefinition("burst_flame_lance"))];
  state.players.P1.mana = 4;
  state.phase = "mainTurn";

  const hpBefore = state.players.P2.hp;
  assert.equal(game.playCardAtIndex("P1", 0), true);
  assert.equal(state.players.P2.hp, hpBefore - 7);
});

test("revised draw minions use death draw and draw-discard timing", () => {
  const game = new ShinDoroGame({ rng: () => 0 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.players.P1.hand = [createRuntimeCard(getCardDefinition("archivist_owl")), createRuntimeCard(getCardDefinition("coin"))];
  state.players.P1.deck = [createRuntimeCard(getCardDefinition("burn"))];
  state.players.P1.mana = 2;
  state.phase = "mainTurn";

  assert.equal(getCardDefinition("novice_mage").attack, 1);
  assert.equal(getCardDefinition("novice_mage").health, 1);

  const novice = game.summonMinion("P1", getCardDefinition("novice_mage"), { canTriggerTrap: false });
  const handBeforeDeath = state.players.P1.hand.length;
  novice.health = 0;
  game.checkForDeaths();
  assert.equal(state.players.P1.hand.length, handBeforeDeath + 1);

  state.players.P1.hand = [createRuntimeCard(getCardDefinition("archivist_owl")), createRuntimeCard(getCardDefinition("coin"))];
  state.players.P1.deck = [createRuntimeCard(getCardDefinition("burn"))];
  state.players.P1.mana = 2;
  state.phase = "mainTurn";

  assert.equal(game.playCardAtIndex("P1", 0), true);
  assert.deepEqual(state.players.P1.hand.map((card) => card.id), ["burn"]);
  assert.equal(state.players.P1.graveyard.some((card) => card.id === "coin"), true);
});

test("natural slot gain caps can be expanded by talents and shrine", () => {
  const capped = new ShinDoroGame({ rng: () => 0.42 });
  capped.setupMatch({
    playerCharacterId: "character_b",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });
  capped.getState().players.P1.temporaryFlags.slotGainModifier.jump = 5;
  capped.applyAdvantageSlots(99, 3);
  assert.equal(capped.getState().players.P1.jumpSlot, 3);

  const expanded = new ShinDoroGame({ rng: () => 0.42 });
  expanded.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: ["god_draw_cap_breakthrough"]
  });
  const state = expanded.getState();
  state.players.P1.temporaryFlags.slotGainModifier.godDraw = 10;
  state.players.P1.persistents.push({
    instanceId: "persistent_underdog",
    ownerId: "P1",
    sourceCardId: "underdog_shrine",
    name: "逆境神龛",
    threat: 2,
    description: "",
    effects: getCardDefinition("underdog_shrine").effects,
    type: "persistent"
  });

  expanded.applyAdvantageSlots(-99, 3);

  assert.equal(state.players.P1.godDrawSlot, 8);
});

test("mana cap talents allow mana to grow beyond ten", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_g",
    aiCharacterId: "character_a",
    playerTalentIds: ["abyssal_mana"]
  });

  const state = game.getState();
  for (let index = 0; index < 12; index += 1) {
    state.currentPlayer = "P1";
    game.beginTurn();
  }

  assert.equal(state.players.P1.maxMana, 12);
  assert.equal(state.players.P1.mana, 12);
});

test("overflow talents convert burned cards into opponent discard and mill", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_g",
    aiCharacterId: "character_a",
    playerTalentIds: ["mental_pollution", "void_backflow"]
  });

  const state = game.getState();
  state.players.P1.handLimit = 1;
  state.players.P1.hand = [createRuntimeCard(getCardDefinition("burn"))];
  state.players.P1.deck = [createRuntimeCard(getCardDefinition("arc_bolt"))];
  state.players.P2.hand = [
    createRuntimeCard(getCardDefinition("inspiration")),
    createRuntimeCard(getCardDefinition("judgment_beam"))
  ];
  state.players.P2.deck = Array.from({ length: 5 }, () => createRuntimeCard(getCardDefinition("shield_doll")));

  game.drawCards("P1", 1, "测试");

  assert.equal(state.players.P1.hand.length, 1);
  assert.equal(state.players.P1.graveyard.some((card) => card.id === "arc_bolt"), true);
  assert.equal(state.players.P2.hand.length, 1);
  assert.equal(state.players.P2.deck.length, 2);
});

test("drawing from an empty deck loses even when hand still has cards", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });

  const state = game.getState();
  state.players.P1.deck = [];
  state.players.P1.hand = [createRuntimeCard(getCardDefinition("burn"))];

  game.drawCards("P1", 1, "测试");

  assert.equal(state.winner, "P2");
  assert.equal(state.phase, "gameOver");
});

test("grace surge increases healing received by one", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_g",
    aiCharacterId: "character_a",
    playerTalentIds: ["grace_surge"]
  });

  const player = game.getState().players.P1;
  player.hp = 10;
  game.resolveAction("P1", { type: "heal", target: "selfHero", amount: 4 }, {});

  assert.equal(player.hp, 15);
});

test("Izumi Ameko slot abilities convert empty hands into damage", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_g",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });

  const state = game.getState();
  state.players.P2.hp = 20;
  state.players.P2.hand = [];
  game.resolveCharacterSlot("P1", "jump10");
  assert.equal(state.players.P2.hp, 12);

  state.players.P2.hp = 20;
  state.players.P2.hand = [createRuntimeCard(getCardDefinition("burn"))];
  game.resolveCharacterSlot("P1", "jump13");
  assert.equal(state.players.P2.hand.length, 0);
  assert.equal(state.players.P2.hp, 16);
});

test("Izumi Ameko overkill discards highest-cost cards first", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_g",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });

  const state = game.getState();
  state.players.P2.hand = [
    createRuntimeCard(getCardDefinition("coin")),
    createRuntimeCard(getCardDefinition("burn")),
    createRuntimeCard(getCardDefinition("judgment_beam"))
  ];

  game.resolveCharacterSlot("P1", "jump13");

  assert.deepEqual(state.players.P2.hand.map((card) => card.id), ["coin"]);
});

test("大奶十点跳脸不会在回合开始被自身被动扣没", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_c",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });

  const state = game.getState();
  state.currentPlayer = "P1";
  state.players.P1.jumpSlot = 10;
  state.players.P1.godDrawSlot = 0;
  state.players.P1.deck = [createRuntimeCard(getCardDefinition("burn"))];
  game.summonMinion("P1", getCardDefinition("ember_wolf"), { triggerOnPlay: false, canTriggerTrap: false });

  game.beginTurn();

  assert.equal(state.pendingChoice?.type, "optionalJump");
  assert.equal(state.players.P1.jumpSlot, 10);

  game.handlePendingChoice({ action: "use" });

  assert.equal(state.pendingChoice, null);
  assert.equal(state.players.P1.jumpSlot, 0);
  assert.equal(state.players.P1.board[0].attack, 5);
});

test("大奶十三点跳脸会按 Overkill 释放而不是被扣成十二点", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_c",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });

  const state = game.getState();
  state.currentPlayer = "P1";
  state.players.P1.jumpSlot = 13;
  state.players.P1.godDrawSlot = 0;
  state.players.P1.deck = [createRuntimeCard(getCardDefinition("burn"))];
  game.summonMinion("P1", getCardDefinition("ember_wolf"), { triggerOnPlay: false, canTriggerTrap: false });

  game.beginTurn();

  assert.equal(state.pendingChoice, null);
  assert.equal(state.players.P1.jumpSlot, 0);
  assert.equal(state.players.P1.board[0].attack, 6);
  assert.equal(state.players.P1.board[0].health, 5);
});

test("大奶的槽位耗散仍会扣除未到十点的最高槽位", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_c",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });

  const state = game.getState();
  state.currentPlayer = "P1";
  state.players.P1.jumpSlot = 9;
  state.players.P1.godDrawSlot = 4;
  state.players.P1.deck = [createRuntimeCard(getCardDefinition("burn"))];

  game.beginTurn();

  assert.equal(state.players.P1.jumpSlot, 8);
  assert.equal(state.players.P1.godDrawSlot, 4);
  assert.equal(state.pendingChoice, null);
});

test("AI mulligan keeps profile cards and replaces slow cards", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });

  const ai = game.getState().players.P2;
  ai.hand = [
    createRuntimeCard(getCardDefinition("iron_colossus")),
    createRuntimeCard(getCardDefinition("tactical_insight")),
    createRuntimeCard(getCardDefinition("arc_bolt")),
    createRuntimeCard(getCardDefinition("coin"))
  ];

  assert.deepEqual(chooseAiMulliganIndices(game.getState(), "P2"), [0]);
});

test("AI chooses lethal hand damage before other actions", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  state.currentPlayer = "P2";
  state.phase = "mainTurn";
  state.players.P1.hp = 2;
  state.players.P2.mana = 1;
  state.players.P2.hand = [createRuntimeCard(getCardDefinition("burn"))];
  state.players.P2.board = [];

  const action = chooseAiAction(game, "P2");
  assert.equal(action.type, "playCard");
  assert.equal(action.index, 0);
});

test("character A gains an extra jump slot when jump increases", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });

  game.adjustSlot("P1", "jump", 1, "test");
  assert.equal(game.getState().players.P1.jumpSlot, 2);
});

test("character B converts small disadvantage into extra god-draw gain", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });

  game.applyAdvantageSlots(2, 1);
  assert.equal(game.getState().players.P2.godDrawSlot, 3);
  assert.equal(game.getState().players.P1.jumpSlot, 0);
});

test("character E gains god-draw when taking more than three damage", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_e",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });

  game.resolveAction("P2", { type: "damage", target: "enemyHero", amount: 4 }, {});
  assert.equal(game.getState().players.P1.godDrawSlot, 1);
});

test("character F heals during the draw phase", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_f",
    aiCharacterId: "character_a",
    playerTalentIds: []
  });

  game.getState().players.P1.hp = 10;
  game.completePlayerMulligan([]);

  assert.equal(game.getState().players.P1.hp, 11);
  assert.equal(game.getState().phase, "mainTurn");
});

test("landmine girl damages the attacking hero when attacked by a minion", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const attacker = game.summonMinion("P1", getCardDefinition("ember_wolf"), { canTriggerTrap: false });
  const defender = game.summonMinion("P2", getCardDefinition("landmine_girl"), { canTriggerTrap: false });
  attacker.canAttack = true;
  attacker.summonedThisTurn = false;

  game.attackWith("P1", attacker.instanceId, defender.instanceId, "minion");

  assert.equal(game.getState().players.P1.hp, 18);
  assert.equal(game.getState().players.P2.hp, 26);
});

test("public play API rejects cards from the non-current player", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const ai = game.getState().players.P2;
  const card = ai.hand[0];
  assert.ok(card);

  const handSizeBefore = ai.hand.length;
  const boardSizeBefore = ai.board.length;
  ai.mana = card.currentCost;

  assert.equal(game.playCardAtIndex("P2", 0), false);
  assert.equal(ai.hand.length, handSizeBefore);
  assert.equal(ai.board.length, boardSizeBefore);
});

test("battlefield caps minions at seven and shared backrow at seven", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  const player = state.players.P1;
  const minionCard = getCardDefinition("shield_doll");
  const persistentCard = getCardDefinition("war_banner");
  const trapCard = getCardDefinition("mirror_wall");
  state.currentPlayer = "P1";
  state.phase = "mainTurn";

  for (let index = 0; index < MAX_MINION_SLOTS; index += 1) {
    const minion = game.summonMinion("P1", minionCard, { canTriggerTrap: false });
    assert.ok(minion);
  }
  assert.equal(game.summonMinion("P1", minionCard, { canTriggerTrap: false }), null);
  assert.equal(player.board.length, MAX_MINION_SLOTS);

  player.hand = [createRuntimeCard(minionCard)];
  player.mana = 10;
  assert.equal(game.playCardAtIndex("P1", 0), false);
  assert.equal(player.hand.length, 1);
  assert.equal(player.board.length, MAX_MINION_SLOTS);

  player.persistents = Array.from({ length: MAX_BACKROW_SLOTS }, () => createPersistentInstance(persistentCard, "P1"));
  player.hand = [createRuntimeCard(persistentCard)];
  player.mana = 10;
  assert.equal(game.playCardAtIndex("P1", 0), false);
  assert.equal(player.hand.length, 1);
  assert.equal(player.persistents.length, MAX_BACKROW_SLOTS);

  player.persistents = Array.from({ length: 3 }, () => createPersistentInstance(persistentCard, "P1"));
  player.traps = Array.from({ length: MAX_BACKROW_SLOTS - 3 }, () => createPersistentInstance(trapCard, "P1"));
  player.hand = [createRuntimeCard(trapCard)];
  player.mana = 10;
  assert.equal(getBackrowSlotCount(player), MAX_BACKROW_SLOTS);
  assert.equal(game.playCardAtIndex("P1", 0), false);
  assert.equal(player.hand.length, 1);
  assert.equal(getBackrowSlotCount(player), MAX_BACKROW_SLOTS);

  player.persistents = [];
  player.traps = Array.from({ length: MAX_BACKROW_SLOTS }, () => createPersistentInstance(trapCard, "P1"));
  player.hand = [createRuntimeCard(trapCard)];
  player.mana = 10;
  assert.equal(game.playCardAtIndex("P1", 0), false);
  assert.equal(player.hand.length, 1);
  assert.equal(player.traps.length, MAX_BACKROW_SLOTS);
});

test("invalid attack targets do not consume the attack or change phase", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const attacker = game.summonMinion("P1", getCardDefinition("ember_wolf"), { canTriggerTrap: false });
  attacker.canAttack = true;
  attacker.summonedThisTurn = false;

  assert.equal(game.attackWith("P1", attacker.instanceId, "missing_minion", "minion"), false);
  assert.equal(attacker.canAttack, true);
  assert.equal(game.getState().phase, "mainTurn");
});

test("hero attacks require the opposing hero target id", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const attacker = game.summonMinion("P1", getCardDefinition("ember_wolf"), { canTriggerTrap: false });
  attacker.canAttack = true;
  attacker.summonedThisTurn = false;

  const aiHpBefore = game.getState().players.P2.hp;
  assert.equal(game.attackWith("P1", attacker.instanceId, "P1_hero", "hero"), false);
  assert.equal(game.getState().players.P2.hp, aiHpBefore);
  assert.equal(attacker.canAttack, true);
  assert.equal(game.getState().phase, "mainTurn");
});

test("day off adds weekend overtime to hand after death", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const minion = game.summonMinion("P1", getCardDefinition("day_off"), { canTriggerTrap: false });
  minion.health = 0;
  game.checkForDeaths();

  assert.equal(game.getState().players.P1.hand.some((card) => card.id === "weekend_overtime"), true);
});

test("iron rice bowl ignores enemy spell and trap targeting", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const minion = game.summonMinion("P1", getCardDefinition("iron_rice_bowl"), { canTriggerTrap: false });

  game.resolveAction(
    "P2",
    { type: "damage", target: "strongestEnemyMinion", amount: 10 },
    { sourceCard: createRuntimeCard(getCardDefinition("arc_bolt")) }
  );
  assert.equal(minion.health, 6);

  game.resolveAction("P2", { type: "destroy", target: "strongestEnemyMinion" }, {
    source: {
      instanceId: "trap_1",
      ownerId: "P2",
      sourceCardId: "mirror_wall",
      name: "Mirror Wall",
      threat: 0,
      description: "",
      effects: [],
      type: "trap"
    }
  });
  assert.equal(minion.health, 6);
});

test("three phase plug grants guard to adjacent allies", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const ally = game.summonMinion("P1", getCardDefinition("novice_mage"), { canTriggerTrap: false });
  game.summonMinion("P1", getCardDefinition("three_phase_plug"), { triggerOnPlay: true, canTriggerTrap: false });

  assert.equal(ally.tags.includes("guard"), true);
});

test("top donor buffs itself before healing when the hero is below ten hp", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);
  game.getState().players.P1.hp = 9;

  const donor = game.summonMinion("P1", getCardDefinition("top_donor"), {
    triggerOnPlay: true,
    canTriggerTrap: false
  });

  assert.equal(donor.attack, 6);
  assert.equal(donor.health, 10);
  assert.equal(donor.maxHealth, 10);
  assert.equal(game.getState().players.P1.hp, 14);
});

test("player reaches main turn after mulligan", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });

  game.completePlayerMulligan([]);
  const state = game.getState();

  assert.equal(state.screen, "game");
  assert.equal(state.currentPlayer, "P1");
  assert.equal(state.phase, "mainTurn");
  assert.equal(state.players.P1.maxMana, 1);
  assert.equal(state.players.P1.hand.length, 4);
});

test("combat phase starts on the first attack and minions ready on the next turn", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const player = game.getState().players.P1;
  game.summonMinion("P1", getCardDefinition("novice_mage"), { canTriggerTrap: false });
  assert.equal(player.board.length > 0, true);
  assert.equal(player.board[0].canAttack, false);

  game.endTurn();
  game.endTurn();

  assert.equal(game.getState().currentPlayer, "P1");
  assert.equal(player.board[0].canAttack, true);

  game.attack(player.board[0].instanceId, "P2_hero", "hero");
  assert.equal(game.getState().phase, "combat");
});

test("AI ends its turn instead of retrying an unplayable minion on a full board", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const state = game.getState();
  const ai = state.players.P2;
  ai.board = [];
  for (let index = 0; index < MAX_MINION_SLOTS; index += 1) {
    const minion = game.summonMinion("P2", getCardDefinition("shield_doll"), { canTriggerTrap: false });
    assert.ok(minion);
  }
  for (const minion of ai.board) {
    minion.canAttack = false;
  }
  ai.hand = [createRuntimeCard(getCardDefinition("iron_colossus"))];
  ai.mana = 10;
  state.currentPlayer = "P2";
  state.phase = "mainTurn";

  assert.equal(game.runAiStep(), true);
  assert.equal(game.getState().currentPlayer, "P1");
});

test("pending god-draw choices ignore invalid card ids without consuming the choice", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  game.getState().players.P1.godDrawSlot = 13;
  game.beginTurn();

  const state = game.getState();
  assert.equal(state.phase, "slotResolution");
  assert.equal(state.pendingChoice?.type, "ultimateGodDraw");
  assert.equal(state.turnStartQueue.length, 2);

  game.handlePendingChoice({ action: "use", cardId: "not_a_real_card" });

  assert.equal(state.phase, "slotResolution");
  assert.equal(state.pendingChoice?.type, "ultimateGodDraw");
  assert.equal(state.turnStartQueue.length, 2);
  assert.equal(state.players.P1.godDrawSlot, 13);
});

test("empty reserve deck does not lock the forced god-draw resolution", () => {
  const game = new ShinDoroGame({ rng: () => 0.42 });
  game.setupMatch({
    playerCharacterId: "character_a",
    aiCharacterId: "character_b",
    playerTalentIds: []
  });
  game.completePlayerMulligan([]);

  const player = game.getState().players.P1;
  player.reserveDeck = [];
  player.godDrawSlot = 13;

  game.beginTurn();

  assert.equal(game.getState().pendingChoice, null);
  assert.equal(game.getState().phase, "mainTurn");
  assert.equal(player.godDrawSlot, 0);
});
