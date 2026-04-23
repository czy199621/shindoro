import { escapeHtml } from "./html.js";
export function renderHandCard(card, disabled = false, extraClass = "") {
    return `
    <button class="card ${escapeHtml(card.type)} ${disabled ? "disabled" : ""} ${extraClass}" data-action="play-card" data-runtime-id="${escapeHtml(card.runtimeId)}" ${disabled ? "disabled" : ""}>
      <span class="card-cost">${card.currentCost}</span>
      <h4>${escapeHtml(card.name)}</h4>
      <p class="card-meta">${escapeHtml(card.type)}${card.tags?.length ? ` · ${escapeHtml(card.tags.join(" / "))}` : ""}</p>
      <p>${escapeHtml(card.description)}</p>
      ${card.type === "minion"
        ? `<div class="stats-line"><span class="stat-badge">攻 ${card.attack}</span><span class="stat-badge">命 ${card.health}</span></div>`
        : ""}
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
      ${card.type === "minion"
        ? `<div class="stats-line"><span class="stat-badge">攻 ${card.attack}</span><span class="stat-badge">命 ${card.health}</span></div>`
        : ""}
      <p class="small-note">${selected ? "再次点击取消替换" : "点击标记替换"}</p>
    </button>
  `;
}
export function renderMinionCard(minion, { ownership, selectedAttackerId, targetable = false }) {
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
    return `
    <button class="${classes.join(" ")}" data-action="${action}" data-minion-id="${escapeHtml(minion.instanceId)}">
      <h4>${escapeHtml(minion.name)}</h4>
      <p class="minion-meta">${escapeHtml(minion.description)}</p>
      <div class="stats-line">
        <span class="stat-badge">攻 ${minion.attack}</span>
        <span class="stat-badge">命 ${minion.health}/${minion.maxHealth}</span>
      </div>
      <p class="small-note">${minion.canAttack && isPlayer ? "可攻击" : "待机中"}</p>
    </button>
  `;
}
export function renderPersistentCard(card) {
    return `
    <div class="persistent-card">
      <h4>${escapeHtml(card.name)}</h4>
      <p class="persistent-meta">威胁 ${card.threat ?? 0}</p>
      <p>${escapeHtml(card.description)}</p>
    </div>
  `;
}
