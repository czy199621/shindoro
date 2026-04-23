import type { MinionInstance, PlayerState, RuntimeCard } from "../types.js";
import { escapeHtml } from "./html.js";

function renderMinionStats(attack: number | undefined, health: number | undefined, maxHealth?: number): string {
  if (attack === undefined || health === undefined) return "";
  const hpText = maxHealth === undefined ? `${health}` : `${health}/${maxHealth}`;
  return `
    <div class="stats-line">
      <span class="stat-badge">攻 ${attack}</span>
      <span class="stat-badge">血 ${hpText}</span>
    </div>
  `;
}

export function renderHandCard(card: RuntimeCard, disabled = false, extraClass = ""): string {
  return `
    <button class="card ${escapeHtml(card.type)} ${disabled ? "disabled" : ""} ${extraClass}" data-action="play-card" data-runtime-id="${escapeHtml(card.runtimeId)}" ${disabled ? "disabled" : ""}>
      <span class="card-cost">${card.currentCost}</span>
      <h4>${escapeHtml(card.name)}</h4>
      <p class="card-meta">${escapeHtml(card.type)}${card.tags?.length ? ` · ${escapeHtml(card.tags.join(" / "))}` : ""}</p>
      <p>${escapeHtml(card.description)}</p>
      ${card.type === "minion" ? renderMinionStats(card.attack, card.health) : ""}
    </button>
  `;
}

export function renderMulliganCard(card: RuntimeCard, selected: boolean): string {
  return `
    <button class="card ${escapeHtml(card.type)} ${selected ? "selected-for-mulligan" : ""}" data-action="toggle-mulligan" data-runtime-id="${escapeHtml(card.runtimeId)}">
      <span class="card-cost">${card.currentCost}</span>
      <h4>${escapeHtml(card.name)}</h4>
      <p class="card-meta">${escapeHtml(card.type)}</p>
      <p>${escapeHtml(card.description)}</p>
      ${card.type === "minion" ? renderMinionStats(card.attack, card.health) : ""}
      <p class="small-note">${selected ? "已标记为换牌" : "点击以选择换牌"}</p>
    </button>
  `;
}

export function renderMinionCard(
  minion: MinionInstance,
  {
    ownership,
    selectedAttackerId,
    targetable = false
  }: {
    ownership: "player" | "enemy";
    selectedAttackerId: string | null;
    targetable?: boolean;
  }
): string {
  const isPlayer = ownership === "player";
  const isSelected = selectedAttackerId === minion.instanceId;
  const action = isPlayer ? "select-attacker" : "attack-target";
  const classes = ["minion-card"];
  if (minion.canAttack && isPlayer) classes.push("ready");
  if (isSelected) classes.push("selected");
  if (targetable) classes.push("targetable");

  return `
    <button class="${classes.join(" ")}" data-action="${action}" data-minion-id="${escapeHtml(minion.instanceId)}">
      <h4>${escapeHtml(minion.name)}</h4>
      <p class="minion-meta">${escapeHtml(minion.description)}</p>
      ${renderMinionStats(minion.attack, minion.health, minion.maxHealth)}
      <p class="small-note">${minion.canAttack && isPlayer ? "可以攻击" : "暂时不能攻击"}</p>
    </button>
  `;
}

export function renderPersistentCard(card: PlayerState["persistents"][number]): string {
  return `
    <div class="persistent-card">
      <h4>${escapeHtml(card.name)}</h4>
      <p class="persistent-meta">威胁 ${card.threat ?? 0}</p>
      <p>${escapeHtml(card.description)}</p>
    </div>
  `;
}
