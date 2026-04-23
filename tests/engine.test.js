import test from "node:test";
import assert from "node:assert/strict";

import { getCardDefinition } from "../dist/data/cards.js";
import { STARTING_DECKS } from "../dist/data/decks.js";
import { TALENT_LOOKUP, getTalentCost } from "../dist/data/talents.js";
import { calculateAdvantage, createRuntimeCard, getAdvantageBreakdown, getSlotGain } from "../dist/engine/rules.js";
import { ShinDoroGame } from "../dist/engine/gameState.js";

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

test("starting decks use 50-card main decks and obey 3-copy limit", () => {
  for (const deck of Object.values(STARTING_DECKS)) {
    assert.equal(deck.mainDeck.length, 50);

    const counts = new Map();
    for (const cardId of deck.mainDeck) {
      counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
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
  assert.equal(game.getState().players.P2.hp, 20);
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
