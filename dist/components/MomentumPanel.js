import { escapeHtml } from "./html.js";
function formatSigned(value) {
    return `${value >= 0 ? "+" : ""}${value}`;
}
function renderMomentumRow(label, value, extraClass = "") {
    return `
    <div class="momentum-row${extraClass ? ` ${extraClass}` : ""}">
      <span class="momentum-label">${escapeHtml(label)}</span>
      <strong class="momentum-value">${formatSigned(value)}</strong>
    </div>
  `;
}
function renderMomentumSide(title, breakdown, tone) {
    const detailText = breakdown.details.length ? breakdown.details.map(escapeHtml).join(" / ") : "无额外扣分";
    return `
    <section class="momentum-side ${tone}">
      <div class="flex-between">
        <div>
          <h3 class="momentum-side-title">${escapeHtml(title)}</h3>
          <p class="small-note">当前总势能分 ${formatSigned(breakdown.total)}</p>
        </div>
        <span class="pill momentum-total ${tone}">${formatSigned(breakdown.total)}</span>
      </div>
      <div class="momentum-rows">
        ${renderMomentumRow("手牌分", breakdown.handScore)}
        ${renderMomentumRow("血量分", breakdown.hpScore)}
        ${renderMomentumRow("威胁值分", breakdown.threatScore)}
        ${renderMomentumRow("特殊扣分", breakdown.specialScore)}
        ${renderMomentumRow("总势能分", breakdown.total, "total")}
      </div>
      <p class="small-note momentum-detail">特殊扣分细则：${detailText}</p>
    </section>
  `;
}
function renderLastSettlement(lastAdvantage) {
    if (!lastAdvantage) {
        return "";
    }
    const breakdown = lastAdvantage.p1Breakdown;
    const summary = [
        `手牌 ${formatSigned(breakdown.handScore)}`,
        `血量 ${formatSigned(breakdown.hpScore)}`,
        `威胁 ${formatSigned(breakdown.threatScore)}`,
        `特殊 ${formatSigned(breakdown.specialScore)}`
    ]
        .map(escapeHtml)
        .join(" / ");
    return `
    <div class="momentum-settlement">
      <div class="flex-between">
        <span class="small-note">上次结算</span>
        <span class="pill momentum-settlement-pill">V = ${formatSigned(lastAdvantage.value)} / 槽位收益 ${lastAdvantage.gain}</span>
      </div>
      <p class="small-note">${summary}</p>
    </div>
  `;
}
export function renderMomentumPanel({ playerBreakdown, enemyBreakdown, lastAdvantage }) {
    const currentValue = playerBreakdown.total;
    const outlook = currentValue > 0
        ? "当前玩家势能更高，回合结算时更偏向获得跳脸槽。"
        : currentValue < 0
            ? "当前 AI 势能更高，回合结算时玩家更偏向获得神抽槽补偿。"
            : "当前双方势能接近，回合结算时不会出现明显的槽位倾斜。";
    const toneClass = currentValue > 0 ? "player" : currentValue < 0 ? "enemy" : "neutral";
    return `
    <div class="sidebar-card momentum-panel">
      <div class="flex-between momentum-header">
        <div>
          <h2 class="section-title">势能面板</h2>
        </div>
        <span class="pill momentum-pill ${toneClass}">当前 V ${formatSigned(currentValue)}</span>
      </div>
      <div class="momentum-grid">
        ${renderMomentumSide("玩家", playerBreakdown, "player")}
        ${renderMomentumSide("AI", enemyBreakdown, "enemy")}
      </div>
      <p class="small-note momentum-outlook">${escapeHtml(outlook)}</p>
      ${renderLastSettlement(lastAdvantage)}
    </div>
  `;
}
