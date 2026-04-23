import { escapeHtml } from "./html.js";
import { renderSlotMeter } from "./SlotMeter.js";
function renderPrimaryResource(label, value, tone) {
    return `
    <div class="hud-resource ${tone}">
      <div class="hud-resource-emblem ${tone}" aria-hidden="true">
        <span class="hud-resource-glyph ${tone}"></span>
      </div>
      <div class="hud-resource-copy">
        <span class="hud-resource-label">${escapeHtml(label)}</span>
        <strong class="hud-resource-value">${escapeHtml(value)}</strong>
      </div>
    </div>
  `;
}
function renderStat(label, value) {
    return `
    <div class="hud-stat">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value)}</span>
    </div>
  `;
}
export function renderPlayerHUD({ player, character, ownership, targetableHero, impactTarget = false }) {
    const isEnemy = ownership === "enemy";
    const classes = ["hud", ownership];
    if (targetableHero)
        classes.push("targetable");
    if (impactTarget)
        classes.push("impact-target");
    return `
    <button class="${classes.join(" ")}" ${targetableHero ? `data-action="attack-hero" data-hero-id="${isEnemy ? "P2_hero" : "P1_hero"}"` : "disabled"}>
      <div class="hud-header">
        <div>
          <div class="hud-title">${escapeHtml(character.name)}</div>
          <div class="small-note">${escapeHtml(character.title ?? character.passive.name)}</div>
        </div>
        <div class="hud-passive small-note">${escapeHtml(character.passive.description)}</div>
      </div>
      <div class="hud-resource-row">
        ${renderPrimaryResource("HP", `${player.hp}/${player.maxHp}`, "hp")}
        ${renderPrimaryResource("Mana", `${player.mana}/${player.maxMana}`, "mana")}
      </div>
      <div class="hud-stats">
        ${renderStat("手牌", `${player.hand.length}`)}
        ${renderStat("牌库", `${player.deck.length}`)}
      </div>
      <div class="slot-metrics">
        ${renderSlotMeter("跳脸槽", player.jumpSlot, "jump", "10 点可主动发动，13 点会强制触发 Overkill。")}
        ${renderSlotMeter("神抽槽", player.godDrawSlot, "god", "10 点可以指定下一抽，13 点改为从备牌库选牌。")}
      </div>
    </button>
  `;
}
