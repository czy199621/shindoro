import { escapeHtml } from "./html.js";
function resolveThreat(attack, health, threat) {
    if (threat !== undefined)
        return threat;
    if (attack === undefined || health === undefined)
        return null;
    return Math.floor(attack + health / 2);
}
function renderMinionStats(attack, health, threat, maxHealth) {
    if (attack === undefined || health === undefined)
        return "";
    const hpText = maxHealth === undefined ? `${health}` : `${health}/${maxHealth}`;
    const threatText = resolveThreat(attack, health, threat);
    return `
    <div class="stats-line">
      <span class="stat-badge attack">攻 ${attack}</span>
      <span class="stat-badge health">血 ${hpText}</span>
      <span class="stat-badge threat">威 ${threatText ?? "-"}</span>
    </div>
  `;
}
export function renderHandCard(card, disabled = false, extraClass = "") {
    return `
    <button class="card ${escapeHtml(card.type)} ${disabled ? "disabled" : ""} ${extraClass}" data-action="play-card" data-runtime-id="${escapeHtml(card.runtimeId)}" ${disabled ? "disabled" : ""}>
      <span class="card-cost">${card.currentCost}</span>
      <h4>${escapeHtml(card.name)}</h4>
      <p class="card-meta">${escapeHtml(card.type)}${card.tags?.length ? ` · ${escapeHtml(card.tags.join(" / "))}` : ""}</p>
      <p>${escapeHtml(card.description)}</p>
      ${card.type === "minion" ? renderMinionStats(card.attack, card.health, card.threat) : ""}
    </button>
  `;
}
export function renderMulliganCard(card, selected) {
    return `
    <button class="card ${escapeHtml(card.type)} ${selected ? "selected-for-mulligan" : ""}" data-action="toggle-mulligan" data-runtime-id="${escapeHtml(card.runtimeId)}">
      <span class="card-cost">${card.currentCost}</span>
      <h4>${escapeHtml(card.name)}</h4>
      <p class="card-meta">${escapeHtml(card.type)}</p>
      <p>${escapeHtml(card.description)}</p>
      ${card.type === "minion" ? renderMinionStats(card.attack, card.health, card.threat) : ""}
      <p class="small-note">${selected ? "已标记为换牌" : "点击以选择换牌"}</p>
    </button>
  `;
}
export function renderMinionCard(minion, { ownership, selectedAttackerId, targetable = false, attacking = false, impactTarget = false, summoning = false }) {
    const isPlayer = ownership === "player";
    const isSelected = selectedAttackerId === minion.instanceId;
    const action = isPlayer ? "select-attacker" : "attack-target";
    const classes = ["minion-card"];
    if (minion.canAttack && isPlayer)
        classes.push("ready");
    if (isSelected)
        classes.push("selected");
    if (targetable)
        classes.push("targetable");
    if (attacking)
        classes.push("attacking");
    if (impactTarget)
        classes.push("impact-target");
    if (summoning)
        classes.push("summoning");
    return `
    <button class="${classes.join(" ")}" data-action="${action}" data-minion-id="${escapeHtml(minion.instanceId)}">
      <h4>${escapeHtml(minion.name)}</h4>
      <p class="minion-meta">${escapeHtml(minion.description)}</p>
      ${renderMinionStats(minion.attack, minion.health, minion.threat, minion.maxHealth)}
      <p class="small-note">${minion.canAttack && isPlayer ? "可以攻击" : "暂时不能攻击"}</p>
    </button>
  `;
}
export function renderPersistentCard(card, { placing = false, cardTone = "persistent" } = {}) {
    const classes = ["persistent-card", cardTone];
    if (placing)
        classes.push("placing");
    return `
    <div class="${classes.join(" ")}">
      <h4>${escapeHtml(card.name)}</h4>
      <p class="persistent-meta">威胁 ${card.threat ?? 0}</p>
      <p>${escapeHtml(card.description)}</p>
    </div>
  `;
}
