import type { CardDefinition, DeckValidationResult } from "../types.js";
import { CARD_LIBRARY, CARD_LOOKUP } from "./cards.js";

export const DECK_STORAGE_KEY = "shindoro.savedDecks.v1";
export const REQUIRED_MAIN_DECK_SIZE = 50;
export const MAX_COPIES_PER_CARD = 3;

const FORBIDDEN_MAIN_DECK_IDS = new Set(["coin", "great_mana_gem"]);

function isTokenCard(card: CardDefinition): boolean {
  return card.tags?.includes("token") ?? false;
}

function isSideboardFinisher(card: CardDefinition): boolean {
  return card.tags?.includes("sideboardFinisher") ?? false;
}

export function isConstructibleCard(card: CardDefinition): boolean {
  if (FORBIDDEN_MAIN_DECK_IDS.has(card.id)) return false;
  if (isTokenCard(card)) return false;
  if (isSideboardFinisher(card)) return false;
  return true;
}

export function getConstructibleCards(): CardDefinition[] {
  return CARD_LIBRARY.filter(isConstructibleCard).sort((left, right) => {
    if (left.cost !== right.cost) return left.cost - right.cost;
    if (left.type !== right.type) return left.type.localeCompare(right.type);
    return left.name.localeCompare(right.name, "zh-Hans");
  });
}

export function validateMainDeck(mainDeck: string[]): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicateCounts: Record<string, number> = {};

  if (mainDeck.length !== REQUIRED_MAIN_DECK_SIZE) {
    errors.push(`主卡组必须正好 ${REQUIRED_MAIN_DECK_SIZE} 张，当前为 ${mainDeck.length} 张。`);
  }

  for (const cardId of mainDeck) {
    duplicateCounts[cardId] = (duplicateCounts[cardId] ?? 0) + 1;
  }

  for (const [cardId, count] of Object.entries(duplicateCounts)) {
    const card = CARD_LOOKUP[cardId];
    if (!card) {
      errors.push(`未知卡牌 ID：${cardId}。`);
      continue;
    }

    if (count > MAX_COPIES_PER_CARD) {
      errors.push(`${card.name}（${card.id}）超过同名 ${MAX_COPIES_PER_CARD} 张限制，当前为 ${count} 张。`);
    }

    if (isSideboardFinisher(card)) {
      errors.push(`${card.name} 是公共备牌终结者，不能进入主卡组。`);
    }

    if (isTokenCard(card)) {
      errors.push(`${card.name} 是衍生卡，不能进入主卡组。`);
    }

    if (card.id === "coin") {
      errors.push("硬币不能进入主卡组，只能通过天赋【战术硬币】获得。");
    }
  }

  if (duplicateCounts.great_mana_gem) {
    errors.push("大魔力宝石已删除，不能进入主卡组。");
  }

  const lowCostCount = mainDeck.filter((cardId) => {
    const card = CARD_LOOKUP[cardId];
    return card && card.cost <= 2;
  }).length;
  if (lowCostCount < 10) {
    warnings.push(`2 费以下卡牌只有 ${lowCostCount} 张，起手可能偏慢。`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cardCount: mainDeck.length,
    duplicateCounts
  };
}
