import test from "node:test";
import assert from "node:assert/strict";

import { getCardDefinition } from "../dist/data/cards.js";
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

test("character B converts small disadvantage into medium god-draw gain", () => {
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

test("minions can attack on their controller's next turn", () => {
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
});
