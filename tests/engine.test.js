import test from "node:test";
import assert from "node:assert/strict";

import { getCardDefinition } from "../dist/data/cards.js";
import { STARTING_DECKS } from "../dist/data/decks.js";
import { TALENT_LOOKUP, getTalentCost } from "../dist/data/talents.js";
import { calculateAdvantage, getSlotGain } from "../dist/engine/rules.js";
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
